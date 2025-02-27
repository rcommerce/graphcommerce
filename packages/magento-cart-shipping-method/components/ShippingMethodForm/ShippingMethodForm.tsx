import {
  ApolloCartErrorAlert,
  useCartQuery,
  useFormGqlMutationCart,
} from '@graphcommerce/magento-cart'
import {
  Form,
  FormHeader,
  ActionCardItemBase,
  ActionCardItemRenderProps,
  ActionCardListForm,
} from '@graphcommerce/next-ui'
import {
  FormProvider,
  useFormAutoSubmit,
  useFormCompose,
  UseFormComposeOptions,
  useFormPersist,
  useWatch,
} from '@graphcommerce/react-hook-form'
import { i18n } from '@lingui/core'
import { Trans } from '@lingui/react'
import { SxProps, Theme } from '@mui/material'
import { useMemo } from 'react'
import { GetShippingMethodsDocument } from './GetShippingMethods.gql'
import { ShippingMethodActionCard } from './ShippingMethodActionCard'
import {
  ShippingMethodFormDocument,
  ShippingMethodFormMutation,
  ShippingMethodFormMutationVariables,
} from './ShippingMethodForm.gql'

export type ShippingMethodFormProps = Pick<UseFormComposeOptions, 'step'> & {
  sx?: SxProps<Theme>
  children?: React.ReactNode
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

export function ShippingMethodForm(props: ShippingMethodFormProps) {
  const { step, sx, children } = props
  const { data: cartQuery, loading } = useCartQuery(GetShippingMethodsDocument)
  const availableMethods = (
    cartQuery?.cart?.shipping_addresses?.[0]?.available_shipping_methods ?? []
  ).filter(notEmpty)
  const selectedMethod = cartQuery?.cart?.shipping_addresses?.[0]?.selected_shipping_method

  const items = useMemo(
    () =>
      availableMethods
        // Move disabled items to the bottom
        .sort((a, b) => (a.available ? -1 : 1))
        .filter((m) => {
          if (m.carrier_code === 'freeshipping') return m.available === true
          return m.method_code
        })
        .map((method) => ({
          ...method,
          disabled: !method?.available,
          value: `${method?.carrier_code}-${method?.method_code ?? ''}`,
        })),
    [availableMethods],
  )

  // The default: When there is only a single shipping method, select that one.
  let carrierMethod: string | undefined = items.length === 1 ? items[0]?.value : undefined

  // Override with the currently selected method if there is one.
  if (selectedMethod?.method_code)
    carrierMethod = `${selectedMethod.carrier_code}-${selectedMethod.method_code}`

  const form = useFormGqlMutationCart<
    ShippingMethodFormMutation,
    ShippingMethodFormMutationVariables & { carrierMethod?: string }
  >(ShippingMethodFormDocument, {
    defaultValues: { carrierMethod },
    onBeforeSubmit: (variables) => {
      const [carrier, method] = (variables.carrierMethod ?? '').split('-')
      return { ...variables, carrier, method }
    },
  })

  const { handleSubmit, control, error } = form
  const submit = handleSubmit(() => {})

  useFormPersist({ form, name: 'ShippingMethodForm' })
  useFormCompose({ form, step, submit, key: 'ShippingMethodForm' })
  useFormAutoSubmit({ form, submit, fields: ['carrierMethod'] })

  if (loading || items.length === 0) return null

  return (
    <FormProvider {...form}>
      <Form onSubmit={submit} noValidate sx={sx}>
        <FormHeader variant='h4' sx={(theme) => ({ marginBottom: 0, mb: theme.spacings.sm })}>
          <Trans id='Shipping method' />
        </FormHeader>

        <ActionCardListForm
          control={control}
          name='carrierMethod'
          size='large'
          color='secondary'
          rules={{ required: i18n._(/* i18n */ 'Please select a shipping method') }}
          items={items}
          render={
            ShippingMethodActionCard as React.FC<ActionCardItemRenderProps<ActionCardItemBase>>
          }
        />
        <ApolloCartErrorAlert error={error} />
      </Form>
      {children}
    </FormProvider>
  )
}

export function useShippingMethod() {
  return useWatch<{ carrierMethod?: string }>({ name: 'carrierMethod' })
}
