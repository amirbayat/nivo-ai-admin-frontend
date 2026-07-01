import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, Alert, Space } from 'antd'
import { useSendOtp, useVerifyOtp } from '@/queries/auth.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

const OTP_LENGTH = 6
const COUNTDOWN = 120

export function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sendOtp = useSendOtp()
  const verifyOtp = useVerifyOtp()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startCountdown() {
    setSeconds(COUNTDOWN)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function handleSendOtp() {
    setErrorMsg('')
    sendOtp.mutate(phone, {
      onSuccess: () => {
        setStep('otp')
        startCountdown()
      },
      onError: () => setErrorMsg(fa.common.error),
    })
  }

  function handleVerify() {
    setErrorMsg('')
    verifyOtp.mutate(
      { phone, otp },
      {
        onSuccess: () => {
          navigate('/admin/dashboard', { replace: true })
        },
        onError: (err) => {
          if (err.message === 'NOT_ADMIN') {
            setErrorMsg(fa.auth.notAdmin)
          } else {
            setErrorMsg(fa.common.error)
          }
        },
      },
    )
  }

  function handleResend() {
    setOtp('')
    handleSendOtp()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        direction: 'rtl',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              {fa.auth.title}
            </Title>
          </div>

          {errorMsg && <Alert type="error" message={errorMsg} showIcon />}

          {step === 'phone' && (
            <Form layout="vertical" onFinish={handleSendOtp}>
              <Form.Item label={fa.auth.phoneLabel} required>
                <Input
                  size="large"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={fa.auth.phonePlaceholder}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={sendOtp.isPending}
                  disabled={phone.length < 10}
                >
                  {fa.auth.sendOtp}
                </Button>
              </Form.Item>
            </Form>
          )}

          {step === 'otp' && (
            <Form layout="vertical" onFinish={handleVerify}>
              <Form.Item>
                <Text type="secondary">{fa.auth.otpSentTo(phone)}</Text>
              </Form.Item>
              <Form.Item label={fa.auth.otpLabel} required>
                <Input
                  size="large"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={OTP_LENGTH}
                  dir="ltr"
                  style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={verifyOtp.isPending}
                  disabled={otp.length !== OTP_LENGTH}
                >
                  {fa.auth.verify}
                </Button>
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                {seconds > 0 ? (
                  <Text type="secondary">{fa.auth.resendIn(seconds)}</Text>
                ) : (
                  <Button type="link" onClick={handleResend} loading={sendOtp.isPending}>
                    {fa.auth.resend}
                  </Button>
                )}
              </Form.Item>
            </Form>
          )}
        </Space>
      </Card>
    </div>
  )
}
