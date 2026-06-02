/** Build a mailto link for job applications (opens the candidate's email client). */
export function buildApplyMailto(job: {
  title: string;
  company: string;
  applyEmail: string;
}): string {
  const subject = encodeURIComponent(`Application: ${job.title} at ${job.company}`);
  const body = encodeURIComponent(
    `Hello,\n\nI am interested in the ${job.title} position at ${job.company}.\n\n` +
      `Please find my details below:\n\n` +
      `Name:\n` +
      `Phone:\n` +
      `LinkedIn / portfolio:\n\n` +
      `Thank you,\n[Your name]`,
  );
  return `mailto:${job.applyEmail.trim()}?subject=${subject}&body=${body}`;
}
