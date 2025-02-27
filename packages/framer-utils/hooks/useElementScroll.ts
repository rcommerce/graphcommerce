import { motionValue, MotionValue, useTransform } from 'framer-motion'
import sync from 'framesync'
import { RefObject, useMemo } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

type ScrollMotionValue = { x: number; y: number; xMax: number; yMax: number }

interface ScrollMotionValues {
  x: MotionValue<number>
  y: MotionValue<number>
  xProgress: MotionValue<number>
  yProgress: MotionValue<number>
  xMax: MotionValue<number>
  yMax: MotionValue<number>
  scroll: MotionValue<ScrollMotionValue>
}

const refScrollMap = new Map<
  RefObject<HTMLElement | undefined> | string,
  MotionValue<ScrollMotionValue>
>()

const initval = () => motionValue({ x: 0, y: 0, xMax: 0, yMax: 0 })

const getScrollMotion = (ref?: RefObject<HTMLElement | undefined>, sharedKey?: string) => {
  if (!ref) return initval()

  const key = sharedKey || ref

  if (!refScrollMap.has(key)) {
    const scroll = initval()
    refScrollMap.set(key, scroll)
  }

  return refScrollMap.get(key) as MotionValue<ScrollMotionValue>
}

export function useElementScroll(ref?: RefObject<HTMLElement | undefined>): ScrollMotionValues {
  const scroll = getScrollMotion(ref)

  const x = useTransform(scroll, (v) => v.x)
  const y = useTransform(scroll, (v) => v.y)
  const xProgress = useTransform(scroll, (v) => (!v.x && !v.xMax ? 0 : v.x / v.xMax))
  const yProgress = useTransform(scroll, (v) => (!v.y && !v.yMax ? 0 : v.y / v.yMax))
  const xMax = useTransform(scroll, (v) => v.xMax)
  const yMax = useTransform(scroll, (v) => v.yMax)

  useIsomorphicLayoutEffect(() => {
    const element = ref?.current
    if (!element) return () => {}

    const updater = () => {
      if (scroll.isAnimating()) return

      sync.read(() => {
        const scrollnew = {
          x: element.scrollLeft,
          y: element.scrollTop,
          xMax: Math.max(0, element.scrollWidth - element.offsetWidth),
          yMax: Math.max(0, element.scrollHeight - element.offsetHeight),
        }

        if (JSON.stringify(scrollnew) !== JSON.stringify(scroll.get())) {
          scroll.set({
            x: element.scrollLeft,
            y: element.scrollTop,
            xMax: Math.max(0, element.scrollWidth - element.offsetWidth),
            yMax: Math.max(0, element.scrollHeight - element.offsetHeight),
          })
        }
      })
    }

    element.addEventListener('scroll', updater, { passive: true })

    const ro = new ResizeObserver(updater)
    ro.observe(element)

    return () => {
      element.removeEventListener('scroll', updater)
      ro.disconnect()
    }
  }, [ref, scroll])

  return useMemo(
    () => ({ x, y, xProgress, yProgress, xMax, yMax, scroll }),
    [x, xMax, xProgress, y, yMax, yProgress, scroll],
  )
}
