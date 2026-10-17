import { Collapse, Drawer, Empty, Space, Tag, Timeline, Typography } from 'antd'
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
    const confidence = item.classificationTrace?.intentConfidence
    return (
      <Space direction="vertical" size={2} style={{ display: 'flex' }}>
        <Text>{fa.salesAgentQuality.traceCustomerMessage(item.customerMessage)}</Text>
        {item.asrCostToman !== undefined && (
          <Text type="secondary">{fa.salesAgentQuality.traceAsrCost(item.asrCostToman)}</Text>
        )}
        {needs && needs.length > 0 && <Text type="secondary">{fa.salesAgentQuality.traceBuyerNeeds(needs)}</Text>}
        {unmatched && <Text type="warning">{fa.salesAgentQuality.traceUnmatchedBuyerNeed(unmatched)}</Text>}
        {/* HIGH عمداً نمایش داده نمی‌شود — فقط وقتی مدل خودش نامطمئن بوده ارزش دیدن دارد */}
        {confidence && confidence !== 'HIGH' && (
          <Text type="warning">{fa.salesAgentQuality.traceLowConfidence(confidence)}</Text>
        )}
      </Space>
    )
  }

  const { agentReply, trace } = item
  const kbLabel = trace?.kbSource ? fa.salesAgentQuality.traceKbSourceLabels[trace.kbSource] : undefined
  // فیدبک کاربر ۱۴۰۵/۰۷/۱۲ — پاسخ‌های قانون‌محور ثابت (فاکتور/سبد/handoff/...) هیچ‌وقت trace
  // ندارند؛ voice آن‌ها فقط روی خودِ agentReply نشسته
  const voice = voiceLine(trace?.voice ?? agentReply?.voice)
  const engine = agentReply?.engine ?? trace?.engine
  // voice processor بعداً یادداشت ttsCache را به event/trace اضافه می‌کند؛ هر دو را ادغام می‌کنیم
  const aceNotes = [...(agentReply?.ace ?? [])]
  for (const n of trace?.ace ?? []) {
    if (!aceNotes.some((x) => x.layer === n.layer && x.reason === n.reason && x.callSite === n.callSite)) aceNotes.push(n)
  }

  return (
    <Space direction="vertical" size={2} style={{ display: 'flex' }}>
      {engine && (
        <Space size={4} wrap>
          <Tag color={engine === 'lean' ? 'green' : 'default'}>{fa.salesAgentQuality.traceEngine[engine]}</Tag>
          {aceNotes.map((n, i) => (
            <Tag key={i} color="blue">{fa.salesAgentQuality.aceLayerLabels[n.layer] ?? n.layer}</Tag>
          ))}
        </Space>
      )}
      {aceNotes.map((n, i) => (
        <Text key={i} type="secondary" style={{ fontSize: 12 }}>
          {fa.salesAgentQuality.traceAceReason(fa.salesAgentQuality.aceLayerLabels[n.layer] ?? n.layer, n.callSite, n.reason)}
        </Text>
      ))}
      {trace && <Text>{fa.salesAgentQuality.traceIntent(trace.intent, trace.handler)}</Text>}
      {kbLabel && <Text>{fa.salesAgentQuality.traceKbSource(kbLabel)}</Text>}
      {trace && (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{fa.salesAgentQuality.traceModel(trace.model)}</Text>
      )}
      {trace?.chargedToman !== undefined && (
        <Text type="secondary">{fa.salesAgentQuality.traceCost(trace.chargedToman)}</Text>
      )}
      {agentReply && <Text>{fa.salesAgentQuality.traceReply(agentReply.text)}</Text>}
      {voice && <Text type="secondary">{voice}</Text>}
      {agentReply?.voiceCostToman !== undefined && (
        <Text type="secondary">{fa.salesAgentQuality.traceVoiceCost(agentReply.voiceCostToman)}</Text>
      )}
      {trace?.turnGoal && trace.salesStage && (
        <Text>
          {fa.salesAgentQuality.traceSalesDecision(
            fa.salesAgentQuality.salesStageLabels[trace.salesStage] ?? trace.salesStage,
            fa.salesAgentQuality.turnGoalLabels[trace.turnGoal] ?? trace.turnGoal,
            trace.decisionReason ?? '—',
            trace.prevSalesStage && trace.prevSalesStage !== trace.salesStage
              ? (fa.salesAgentQuality.salesStageLabels[trace.prevSalesStage] ?? trace.prevSalesStage)
              : undefined,
          )}
        </Text>
      )}
      {trace?.perception && (
        <Text type="secondary">
          {fa.salesAgentQuality.tracePerception(
            trace.perception.primaryAct,
            trace.perception.sentiment,
            trace.perception.buyingSignal,
            trace.perception.objection ? `${trace.perception.objection.type} («${trace.perception.objection.quote}»)` : undefined,
          )}
        </Text>
      )}
      {trace?.perceptionFailed && <Text type="warning">{fa.salesAgentQuality.tracePerceptionFailed}</Text>}
      {trace?.validatorViolations && trace.validatorViolations.length > 0 && (
        <Text type="danger">
          {fa.salesAgentQuality.traceValidatorViolations(trace.validatorViolations.map(v => v.code))}
        </Text>
      )}
      {trace?.correctiveRetry && <Text type="warning">{fa.salesAgentQuality.traceCorrectiveRetry}</Text>}
      {trace?.candidateProductIds && trace.candidateProductIds.length > 0 && (
        <Text type="secondary">{fa.salesAgentQuality.traceCandidateProductIds(trace.candidateProductIds)}</Text>
      )}
      {trace?.quickReplies && trace.quickReplies.length > 0 && (
        <Text type="secondary">{fa.salesAgentQuality.traceQuickReplies(trace.quickReplies)}</Text>
      )}
      {trace?.toolsCalled && trace.toolsCalled.length > 0 && (
        <Text type="secondary">{fa.salesAgentQuality.traceToolsCalled(trace.toolsCalled.map(t => t.name))}</Text>
      )}
      {trace?.relevantProductIdsRaw && trace.relevantProductIdsRaw.length > 0 && (
        <Text type="secondary">{fa.salesAgentQuality.traceRelevantProductIdsRaw(trace.relevantProductIdsRaw)}</Text>
      )}
      {trace?.lastShownProducts && trace.lastShownProducts.length > 0 && (
        <Text type="secondary">
          {fa.salesAgentQuality.traceLastShownProducts(trace.lastShownProducts.map(p => p.name))}
        </Text>
      )}
      {trace?.initialCatalogProductIds && trace.initialCatalogProductIds.length > 0 && (
        <Text type="secondary">{fa.salesAgentQuality.traceInitialCatalogIds(trace.initialCatalogProductIds)}</Text>
      )}
      {trace?.stepsUsed !== undefined && (
        <Text type="secondary">{fa.salesAgentQuality.traceStepsUsed(trace.stepsUsed)}</Text>
      )}
      {trace?.isFallbackAttempt && <Text type="warning">{fa.salesAgentQuality.traceFallbackAttempt}</Text>}
      {trace?.mutationHappened && <Text type="secondary">{fa.salesAgentQuality.traceMutationHappened}</Text>}
      {trace?.progressHappened && <Text type="secondary">{fa.salesAgentQuality.traceProgressHappened}</Text>}
      {trace?.suspiciousPriceClaims && trace.suspiciousPriceClaims.length > 0 && (
        <Text type="danger">{fa.salesAgentQuality.traceSuspiciousPriceClaims(trace.suspiciousPriceClaims)}</Text>
      )}
      {trace?.persuasionTechniquesUsed && trace.persuasionTechniquesUsed.length > 0 && (
        <Text type="secondary">
          {fa.salesAgentQuality.tracePersuasionTechniquesUsed(
            trace.persuasionTechniquesUsed.map(t => fa.salesAgentQuality.persuasionTechniqueLabels[t] ?? t),
          )}
        </Text>
      )}
      {trace?.usedGeneralKnowledge && <Text type="secondary">{fa.salesAgentQuality.traceUsedGeneralKnowledge}</Text>}
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
