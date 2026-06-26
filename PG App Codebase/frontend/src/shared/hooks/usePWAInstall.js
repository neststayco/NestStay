import { useState, useEffect } from 'react'

const IOS_DISMISS_KEY = 'pwa_ios_banner_dismissed'

function detectIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isRunningStandalone() {
  return window.navigator.standalone === true
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [iosBannerDismissed, setIosBannerDismissed] = useState(
    () => localStorage.getItem(IOS_DISMISS_KEY) === '1'
  )

  const isIOS = detectIOS()
  const isStandalone = isRunningStandalone()
  const showIOSBanner = isIOS && !isStandalone && !iosBannerDismissed

  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    function handleAppInstalled() {
      setDeferredPrompt(null)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setCanInstall(false)
    }
  }

  function dismissIOSBanner() {
    localStorage.setItem(IOS_DISMISS_KEY, '1')
    setIosBannerDismissed(true)
  }

  return { canInstall, promptInstall, showIOSBanner, dismissIOSBanner }
}
