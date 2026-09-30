import { Collapse, Drawer, Empty, Space, Timeline, Typography } from 'antd'
import { useConversationTrace } from '@/queries/sales-agent-quality.queries'
import type { AiTraceVoiceInfo, ConversationTraceItem } from '@/types/api'
import { fa } from '@/locales/fa'

const { Text } = Typography

function voiceLine(voice?: AiTraceVoiceInfo): string | null {
  if (!voice) return null
  if (voice.generated && voice.voiceName) {
    return fa.salesAgentQuality.traceVoiceGenerated(voice.voiceName, voice.toneVariant ?? '')
  }
  if (voice.generated) return fa.salesAgentQuality.traceVoicePending
  const reasonLabel = (voice.reason && fa.salesAgentQuality.traceVoiceReasonLabels[voice.reason]) ?? voice.reason ?? ''
  return fa.salesAgentQuality.traceVoiceNotGenerated(reasonLabel)
}

// docs/PRD-admin-ai-decision-trace-log.md بخش ۳ — تایم‌لاین ساده، منطق ترکیب سمت بک‌اند
// (getConversationTrace) انجام شده، اینجا فقط رندر می‌شود
function TraceTimelineItem({ item }: { item: ConversationTraceItem }) {
  if (item.customerMessage !== undefined) {
    const needs = item.classificationTrace?.buyerNeeds
    const unmatched = item.classificationTrace?.unmatchedBuyerNeed
    return (
      <Space direction="vertical" size={2} style={{ display: 'flex' }}>
        <Text>{fa.salesAgentQuality.traceCustomerMessage(item.customerMessage)}</Text>
        {needs && needs.length > 0 && <Text type="secondary">{fa.salesAgentQuality.traceBuyerNeeds(needs)}</Text>}
        {unmatched && <Text type="warning">{fa.salesAgentQuality.traceUnmatchedBuyerNeed(unmatched)}</Text>}
      </Space>
    )
  }

  const { agentReply, trace } = item
  const kbLabel = trace?.kbSource ? fa.salesAgentQuality.traceKbSourceLabels[trace.kbSource] : undefined
  const voice = voiceLine(trace?.voice)

  return (
    <Space direction="vertical" size={2} style={{ display: 'flex' }}>
      {trace && <Text>{fa.salesAgentQuality.traceIntent(trace.intent, trace.handler)}</Text>}
      {kbLabel && <Text>{fa.salesAgentQuality.traceKbSource(kbLabel)}</Text>}
      {trace && (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{fa.salesAgentQuality.traceModel(trace.model)}</Text>
      )}
      {agentReply && <Text>{fa.salesAgentQuality.traceReply(agentReply.text)}</Text>}
      {voice && <Text type="secondary">{voice}</Text>}
      {trace?.factsOrPrompt && (
        <Collapse
          size="small"
          ghost
          items={[
            {
              key: 'prompt',
              label: fa.salesAgentQuality.traceShowPrompt,
              children: <Text style={{ whiteSpace: 'pre-wrap' }}>{trace.factsOrPrompt}</Text>,
            },
          ]}
        />
      )}
    </Space>
  )
}

export function ConversationTraceDrawer({
  conversationId,
  onClose,
}: {
  conversationId: string | null
  onClose: () => void
}) {
  const { data, isLoading } = useConversationTrace(conversationId)
  const items = data?.items ?? []

  return (
    <Drawer open={!!conversationId} onClose={onClose} title={fa.salesAgentQuality.traceTitle} width={640} loading={isLoading}>
      {items.length === 0 ? (
        <Empty description={fa.salesAgentQuality.traceEmpty} />
      ) : (
        <Timeline
          items={items.map((item) => ({
            children: <TraceTimelineItem item={item} />,
          }))}
        />
      )}
    </Drawer>
  )
}
