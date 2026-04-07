import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const maxDuration = 30;

// Helper to safely convert Firestore Timestamp or Date to ISO string
function toDateStr(val: any): string {
  if (!val) return 'N/A';
  if (typeof val.toDate === 'function') return val.toDate().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

export async function POST(req: Request) {
  // Guard: ensure the API key is configured (it must be set in Vercel env vars for production)
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service is not configured. GOOGLE_GENERATIVE_AI_API_KEY is missing.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages } = await req.json();

  // Fetch all collections in parallel
  const [stonesSnap, remaindersSnap, archivesSnap, notesSnap, logsSnap] = await Promise.allSettled([
    getDocs(collection(db, 'stones')),
    getDocs(query(collection(db, 'remainders'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'archives'), orderBy('archivedAt', 'desc'))),
    getDocs(query(collection(db, 'notes'), orderBy('createdAt', 'desc'), limit(20))),
    getDocs(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20))),
  ]);

  // --- Stones ---
  let stonesContext = 'STONES: Unavailable';
  if (stonesSnap.status === 'fulfilled') {
    const stones = stonesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const inStock = stones.filter((s) => s.status === 'In Stock').length;
    const sold = stones.filter((s) => s.status === 'Sold').length;
    const pending = stones.filter((s) => s.status === 'Pending').length;
    const list = stones
      .slice(0, 15)
      .map(
        (s) =>
          `  - [${s.id}] ${s.stoneName || s.name || 'Unknown'} | ${s.stoneType || 'N/A'} | ${s.weight || s.stoneWeight || '?'}ct | Status: ${s.status} | Price: LKR ${s.sellingPrice || s.price || 0}`
      )
      .join('\n');
    stonesContext = `STONES (Total: ${stones.length} | In Stock: ${inStock} | Sold: ${sold} | Pending: ${pending})\n${list}`;
  }

  // --- Reminders ---
  let remindersContext = 'REMINDERS: Unavailable';
  if (remaindersSnap.status === 'fulfilled') {
    const rems = remaindersSnap.value.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const overdue = rems.filter((r) => r.status === 'overdue').length;
    const paid = rems.filter((r) => r.status === 'paid').length;
    const pending = rems.filter((r) => r.status === 'pending').length;
    const totalProfit = rems.reduce((s, r) => s + (r.myProfit || 0), 0);
    const list = rems
      .slice(0, 15)
      .map(
        (r) =>
          `  - ${r.stoneName} | Owner: ${r.ownerName || 'Me'} | Buyer: ${r.buyerName || r.buyerType} | Profit: LKR ${r.myProfit || 0} | Due: ${toDateStr(r.paymentReceivingDate)} | Status: ${r.status}`
      )
      .join('\n');
    remindersContext = `REMINDERS (Total: ${rems.length} | Overdue: ${overdue} | Paid: ${paid} | Pending: ${pending} | Awaiting Profit: LKR ${totalProfit.toLocaleString()})\n${list}`;
  }

  // --- Archives ---
  let archivesContext = 'ARCHIVES: Unavailable';
  if (archivesSnap.status === 'fulfilled') {
    const arcs = archivesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const totalSales = arcs.reduce((s, a) => s + (a.sellingPrice || 0), 0);
    const totalProfit = arcs.reduce((s, a) => s + (a.myProfit || 0), 0);
    const list = arcs
      .slice(0, 15)
      .map(
        (a) =>
          `  - ${a.stoneName} | Selling: LKR ${a.sellingPrice || 0} | Profit: LKR ${a.myProfit || 0} | Archived: ${toDateStr(a.archivedAt)} | Buyer: ${a.buyerName || a.buyerType}`
      )
      .join('\n');
    archivesContext = `ARCHIVES/COMPLETED SALES (Total: ${arcs.length} | Total Sales: LKR ${totalSales.toLocaleString()} | Total Profit: LKR ${totalProfit.toLocaleString()})\n${list}`;
  }

  // --- Notes ---
  let notesContext = 'NOTES: Unavailable';
  if (notesSnap.status === 'fulfilled') {
    const notes = notesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const list = notes
      .map((n) => `  - [${toDateStr(n.createdAt)}] ${n.title || 'Untitled'}: ${(n.content || n.text || '').slice(0, 120)}`)
      .join('\n');
    notesContext = `NOTES (${notes.length} recent)\n${list}`;
  }

  // --- Activity Logs ---
  let logsContext = 'ACTIVITY LOGS: Unavailable';
  if (logsSnap.status === 'fulfilled') {
    const logs = logsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const list = logs
      .map((l) => `  - [${toDateStr(l.timestamp || l.createdAt)}] ${l.action || l.message || l.description || JSON.stringify(l).slice(0, 100)}`)
      .join('\n');
    logsContext = `ACTIVITY LOGS (${logs.length} recent)\n${list}`;
  }

  const databaseContext = `
=== LIVE DATABASE SNAPSHOT (${new Date().toDateString()}) ===

${stonesContext}

${remindersContext}

${archivesContext}

${notesContext}

${logsContext}

===`;

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: `You are an AI assistant for the Zain Gems dashboard. The workspace owner's name is Raskan.
You have access to live data from the Firestore database shown below. Use it to answer questions accurately and helpfully.
When answering, reference specific records where relevant (stone names, amounts, dates). Be concise, professional, and friendly.
Currency is LKR (Sri Lankan Rupees) unless stated otherwise. when talking about sales and profit , remainders collection + archived collection . in my term i am when payment is done i move  transaction from remainders to archive. so when you calculate total sales and profit , remainders collection + archived collection . 

${databaseContext}`,
    messages,
  });

  return result.toTextStreamResponse();
}
