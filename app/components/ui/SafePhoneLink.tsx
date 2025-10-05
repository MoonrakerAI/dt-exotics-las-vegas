'use client'

import { getVerifiedPhoneLink, formatPhoneForDisplay } from '@/app/lib/phone-utils'

interface SafePhoneLinkProps {
  phoneNumber: string
  type?: 'tel' | 'sms'
  className?: string
  children?: React.ReactNode
}

/**
 * Safe phone link component that only creates links for verified phone numbers
 * Prevents phishing vectors by validating against known business contacts
 */
export default function SafePhoneLink({ 
  phoneNumber, 
  type = 'tel', 
  className = '',
  children 
}: SafePhoneLinkProps) {
  const link = getVerifiedPhoneLink(phoneNumber, type)
  
  // If number is not verified, render as plain text
  if (!link) {
    return (
      <span className={className}>
        {children || formatPhoneForDisplay(phoneNumber)}
      </span>
    )
  }
  
  return (
    <a href={link} className={className}>
      {children || formatPhoneForDisplay(phoneNumber)}
    </a>
  )
}
