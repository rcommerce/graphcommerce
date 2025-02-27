import {
  useFormGqlMutationCart,
  useCurrentCartId,
  useClearCurrentCartId,
} from '@graphcommerce/magento-cart'
import { useFormCompose } from '@graphcommerce/react-hook-form'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { PaymentPlaceOrderProps } from '../Api/PaymentMethod'
import { PaymentMethodPlaceOrderNoopDocument } from './PaymentMethodPlaceOrderNoop.gql'

export function PaymentMethodPlaceOrderNoop(props: PaymentPlaceOrderProps) {
  const { step, code } = props
  const clearCurrentCartId = useClearCurrentCartId()

  const { currentCartId } = useCurrentCartId()
  const form = useFormGqlMutationCart(PaymentMethodPlaceOrderNoopDocument)

  const { handleSubmit, data, error } = form
  const { push } = useRouter()

  useEffect(() => {
    if (!data?.placeOrder?.order || error || !currentCartId) return
    clearCurrentCartId()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    push({ pathname: '/checkout/success', query: { cart_id: currentCartId } })
  }, [clearCurrentCartId, currentCartId, data?.placeOrder?.order, error, push])

  const submit = handleSubmit(() => {})

  useFormCompose({ form, step, submit, key: `PaymentMethodPlaceOrder_${code}` })

  return <form onSubmit={submit} />
}
