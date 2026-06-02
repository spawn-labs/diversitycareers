import { createPublishedJob, normalizeDraft } from "./jobs";
import { getCheckoutSession } from "./stripe";
import { mutateStore, readStore } from "./store";

/** Publish job from a paid checkout (webhook or success-page fallback). */
export async function fulfillCheckoutIfPaid(
  kv: KVNamespace,
  stripeSessionId: string,
  stripeSecretKey: string,
): Promise<{ fulfilled: boolean; jobId?: string; employerEmail?: string }> {
  const store = await readStore(kv);
  const pending = store.pendingCheckouts.find(
    (p) => p.stripeCheckoutSessionId === stripeSessionId,
  );
  if (!pending) return { fulfilled: false };

  if (pending.status === "paid" && pending.jobId) {
    return {
      fulfilled: true,
      jobId: pending.jobId,
      employerEmail: pending.employerEmail,
    };
  }

  const session = await getCheckoutSession(stripeSecretKey, stripeSessionId);
  const paid =
    session.payment_status === "paid" || session.status === "complete";

  if (!paid) {
    return { fulfilled: false, employerEmail: pending.employerEmail };
  }

  let jobId: string | undefined;

  await mutateStore(kv, (s) => {
    const p = s.pendingCheckouts.find(
      (x) => x.stripeCheckoutSessionId === stripeSessionId,
    );
    if (!p) return;
    if (p.status === "paid" && p.jobId) {
      jobId = p.jobId;
      return;
    }

    const now = new Date().toISOString();
    const draft = normalizeDraft(p.draft);
    const job = createPublishedJob(
      {
        ...draft,
        stripeCheckoutSessionId: stripeSessionId,
      },
      { paidAt: now },
    );

    s.jobs.push(job);
    p.status = "paid";
    p.jobId = job.id;
    jobId = job.id;
  });

  return {
    fulfilled: Boolean(jobId),
    jobId,
    employerEmail: pending.employerEmail,
  };
}
