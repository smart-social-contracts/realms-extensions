import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startRealm, type Scenario } from '../realm';

// A department whose policy counts the votes cast (GGG I-GOV-3, I-GOV-14): a majority of the yes and no votes, a quorum over the
// policy's n, the head's casting vote, a veto, and a second vote after a tie. The proposals are shaped as the realm stores them
// (the Council votes P-6 and P-7 of the local demo realm); the page is the built bundle on a canned realm.
const OUT = join(__dirname, '..', 'test-results');
test.use({ viewport: { width: 1280, height: 1100 } });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
  mkdirSync(OUT, { recursive: true });
});
test.afterAll(() => close());

const JORDI = 'z32zf-ic72u-jhtqq-ojjqp-jblhx-dxxin-vqelt-ljmo4-ymwmh-gcnzo-hae'; // head of the Council: the casting vote
const JORDI_SHORT = `${JORDI.slice(0, 8)}...${JORDI.slice(-6)}`;
const LAIA = 'cybi7-lmxkc-lgijx-c6jqu-mzeh7-mamgq-vtorr-5qrvs-52frq-i6chg-2ae';
const NEUS = '7qjc2-hqdzn-yb6cl-24zrj-jjwem-wvy3a-ueqex-ljumv-5hbod-2c3jz-rae';
const PAU = 'kmsvy-37fmb-ktmz5-b7c5m-36fp4-ausay-ewo76-zuusq-7uh7s-rczwk-kqe';
const PAST = 1_700_000_000;
const FUTURE = 4_102_444_800;
const FIRST_VOTE = { yes: 2, no: 2, abstain: 1, eligible: 5, seats: 5 };

type Ballot = { voter: string; choice: string };
const ballot = (voter: string, choice: string): Ballot => ({ voter, choice });

/** A Council vote as the realm stores it, with what ``fields`` changes in the proposal, and its ballots. */
function council(
  { id = 'P-6', title = 'Close Carrer Major to traffic on Sundays', ...fields }: Record<string, unknown>,
  votes: Ballot[],
  counted?: { yes: number; no: number; abstain: number },
  locale = 'en',
): Scenario {
  const tally = counted ?? {
    yes: votes.filter((v) => v.choice === 'yes').length,
    no: votes.filter((v) => v.choice === 'no').length,
    abstain: votes.filter((v) => v.choice === 'abstain').length,
  };
  const proposal = {
    id,
    title,
    description: 'A trial until March',
    kind: '',
    matter: '',
    proposer: JORDI,
    on_behalf_of: '',
    filed_under: '',
    prepared_by: '',
    action: null,
    status: 'voting',
    opens_at: 1_794_398_964,
    deadline: FUTURE,
    effective_at: 0,
    threshold: 50_000_000,
    quorum: 33_333_333,
    threshold_of: 'cast',
    casting_vote: JORDI,
    majority_of_cast: true,
    first_vote: null,
    tally: { ...tally, eligible: 5, seats: 5, veto: [] },
    result: null,
    links: [],
    tags: ['mobility'],
    replaced_by: '',
    department: 'Council',
    ...fields,
  };
  return {
    locale,
    replies: {
      proposal_list: { ok: true, proposals: [{ id, title, status: 'voting', deadline: proposal.deadline, proposer: JORDI }], next: null },
      proposal_get: { ok: true, proposal, tally, eligible: 5, votes: votes.map((v) => ({ ...v, cast_by: v.voter })), next: null },
      department_list: { ok: true, departments: [{ id: 'Realm', is_root: true }, { id: 'Council', is_root: false }] },
      realm_info: { ok: true, realm: { timezone: 'Europe/Madrid' } },
    },
  };
}

async function open(page: import('@playwright/test').Page, id = 'P-6') {
  await page.goto(`${url}/extensions/voting/proposals/${id.replace('P-', '')}`);
  await expect(page.getByTestId('requirement-line')).toBeVisible();
}

test('the first vote of a Council that counts the votes cast: its rule in words, the bar over yes and no, and who it waits for', async ({ page }) => {
  scenario = council({}, [ballot(LAIA, 'yes'), ballot(NEUS, 'no')]);
  await open(page);

  await expect(page.getByTestId('requirement-line')).toHaveText(
    `Requirement: more than 50% yes of the yes and no votes cast, at least 2 of the policy's 5 seats must vote, abstentions count towards the quorum, not the majority, a tie at the threshold goes to a second vote and a tie at the threshold in the second vote goes to the yes of the casting vote (${JORDI_SHORT})`,
  );
  await expect(page.getByTestId('requirement-line')).not.toContainText('3 of the policy');
  await expect(page.getByTestId('approval-label')).toHaveText('Approval: more than 50% yes of the yes and no votes cast');
  await expect(page.getByTestId('approval-figure')).toHaveText('1 of 2');
  await expect(page.getByTestId('waiting-line')).toHaveText('Waiting for 3 more voters, or the deadline');
  await expect(page.getByTestId('second-vote-line')).toHaveCount(0);
  await expect(page.getByTestId('casting-note')).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'department-majority-first-vote.png'), fullPage: true });
});

test('the second vote says it follows a tied first vote, what that came to, and who holds the casting vote', async ({ page }) => {
  scenario = council({ id: 'P-7', title: 'Plant 40 trees on Avenida del Puerto', first_vote: FIRST_VOTE }, [ballot(JORDI, 'yes'), ballot(PAU, 'no')]);
  await open(page, 'P-7');

  await expect(page.getByTestId('second-vote-line')).toHaveText(
    "Second vote: the first vote ended in a tie (2 yes, 2 no, 1 abstain), so the proposal was put to a second vote under the same rule. The first vote's ballots were deleted: everyone votes again.",
  );
  // it is the second vote: the rule has no second vote to come, only the casting vote of its tie
  await expect(page.getByTestId('requirement-line')).not.toContainText('goes to a second vote');
  await expect(page.getByTestId('requirement-line')).toContainText('a tie at the threshold in the second vote goes to the yes of the casting vote');
  await expect(page.getByTestId('approval-figure')).toHaveText('1 of 2'); // the count of this vote, not of the first
  await expect(page.getByTestId('casting-note')).toHaveText(
    `Yes and no are tied at the threshold again: the yes of the casting vote (${JORDI_SHORT}) decides it, if they still hold a seat.`,
  );
  await page.screenshot({ path: join(OUT, 'department-majority-second-vote.png'), fullPage: true });
});

test('a tie in the second vote waits for the casting yes until the casting member has given it', async ({ page }) => {
  scenario = council({ id: 'P-7', first_vote: FIRST_VOTE }, [ballot(LAIA, 'yes'), ballot(PAU, 'no')]);
  await open(page, 'P-7');
  await expect(page.getByTestId('casting-note')).toHaveText(
    `Yes and no are tied at the threshold again: it passes only with a yes from the casting vote (${JORDI_SHORT}).`,
  );
  await page.screenshot({ path: join(OUT, 'department-majority-second-vote-waiting-for-casting.png'), fullPage: true });
});

test('a tie in the second vote of a department with no head says a tie rejects it', async ({ page }) => {
  scenario = council({ id: 'P-7', first_vote: FIRST_VOTE, casting_vote: '' }, [ballot(LAIA, 'yes'), ballot(PAU, 'no')]);
  await open(page, 'P-7');
  await expect(page.getByTestId('casting-note')).toHaveText('Yes and no are tied at the threshold again, and the vote has no casting vote: a tie rejects it.');
  await expect(page.getByTestId('requirement-line')).toContainText('a tie at the threshold in the second vote rejects it');
});

test('a first vote that tied at its deadline says that a second vote follows', async ({ page }) => {
  scenario = council({ deadline: PAST }, [ballot(LAIA, 'yes'), ballot(NEUS, 'no'), ballot(PAU, 'abstain')]);
  await open(page);
  await expect(page.getByTestId('ended-line')).toContainText('yes and no are tied at the threshold, so a second vote follows. Awaiting finalization.');
  await page.screenshot({ path: join(OUT, 'department-majority-first-vote-ended-tied.png'), fullPage: true });
});

test('a first vote that tied and ended after the proposal takes effect says it expires instead of going to a second vote', async ({ page }) => {
  scenario = council({ deadline: PAST, effective_at: PAST - 1000 }, [ballot(LAIA, 'yes'), ballot(NEUS, 'no'), ballot(PAU, 'abstain')]);
  await open(page);
  await expect(page.getByTestId('ended-line')).toContainText(
    'yes and no are tied at the threshold, but the vote ended after the time the proposal takes effect, so it expires instead of going to a second vote. Awaiting finalization.',
  );
  await page.screenshot({ path: join(OUT, 'department-majority-first-vote-ended-tied-expires.png'), fullPage: true });
});

test('a second vote that tied at its deadline is decided by the casting yes, if its holder still holds a seat', async ({ page }) => {
  scenario = council({ id: 'P-7', deadline: PAST, first_vote: FIRST_VOTE }, [ballot(JORDI, 'yes'), ballot(PAU, 'no')]);
  await open(page, 'P-7');
  await expect(page.getByTestId('ended-line')).toContainText(
    'yes and no are tied at the threshold again, and the casting vote decides it, if its holder still holds a seat. Awaiting finalization.',
  );
  await page.screenshot({ path: join(OUT, 'department-majority-second-vote-ended-casting.png'), fullPage: true });
});

test('a second vote that ended in a majority says the yes votes exceed the threshold', async ({ page }) => {
  scenario = council({ id: 'P-7', deadline: PAST, first_vote: FIRST_VOTE }, [ballot(JORDI, 'yes'), ballot(LAIA, 'yes'), ballot(PAU, 'no')]);
  await open(page, 'P-7');
  await expect(page.getByTestId('ended-line')).toContainText('the yes votes exceed the threshold. Awaiting finalization.');
  await expect(page.getByTestId('casting-note')).toHaveCount(0);
});

test("a veto holder's no is named while the vote is open, and the rule says it rejects", async ({ page }) => {
  scenario = council(
    { tally: { yes: 2, no: 1, abstain: 0, eligible: 5, seats: 5, veto: [NEUS] } },
    [ballot(JORDI, 'yes'), ballot(LAIA, 'yes'), ballot(NEUS, 'no')],
  );
  await open(page);
  await expect(page.getByTestId('requirement-line')).toContainText("at least 2 of the policy's 5 seats must vote, abstentions count towards the quorum, not the majority, no veto holder may vote no, a tie");
  await expect(page.getByTestId('waiting-line')).toHaveText('Waiting for a veto holder to change their no, or the deadline');
  await page.screenshot({ path: join(OUT, 'department-majority-veto.png'), fullPage: true });
});

test("a threshold of the policy's seats adds them to the majority of the votes cast", async ({ page }) => {
  scenario = council({ threshold_of: 'eligible', threshold: 60_000_000 }, [ballot(JORDI, 'yes'), ballot(LAIA, 'yes'), ballot(NEUS, 'no')]);
  await open(page);
  await expect(page.getByTestId('requirement-line')).toContainText(
    "Requirement: 3 of the policy's 5 seats must vote yes, more than 50% yes of the yes and no votes cast, at least 2 of the policy's 5 seats must vote, abstentions count towards the quorum, not the majority",
  );
  await expect(page.getByTestId('approval-label')).toHaveText("Approval: 3 of the policy's 5 seats must vote yes");
  await expect(page.getByTestId('approval-figure')).toHaveText('2 of 5');
  await page.screenshot({ path: join(OUT, 'department-majority-eligible.png'), fullPage: true });
});

test('a department that decides by m of n keeps its seat wording and shows no second vote', async ({ page }) => {
  scenario = council(
    {
      threshold: 60_000_000,
      threshold_of: 'eligible',
      casting_vote: '',
      majority_of_cast: false,
      tally: { yes: 1, no: 0, abstain: 0, eligible: 5, seats: 5, veto: [] },
    },
    [ballot(LAIA, 'yes')],
  );
  await open(page);
  await expect(page.getByTestId('requirement-line')).toContainText(
    "Requirement: 3 of the policy's 5 seats must vote yes, abstentions and members who do not vote count against it",
  );
  await expect(page.getByTestId('waiting-line')).toContainText('2 more approvals');
  await expect(page.getByTestId('second-vote-line')).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'department-majority-m-of-n.png'), fullPage: true });
});

test('the list marks a proposal that is in its second vote', async ({ page }) => {
  scenario = council({ id: 'P-7', first_vote: FIRST_VOTE }, [ballot(JORDI, 'yes'), ballot(PAU, 'no')]);
  await page.goto(`${url}/extensions/voting`);
  await expect(page.getByTestId('card-second-vote')).toHaveText('Second vote, after a tied first vote');
  await page.screenshot({ path: join(OUT, 'department-majority-list.png'), fullPage: true });
});

for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
  test(`the second vote reads in ${locale}, with nothing left to fill in`, async ({ page }) => {
    scenario = council({ id: 'P-7', first_vote: FIRST_VOTE }, [ballot(JORDI, 'yes'), ballot(PAU, 'no')], undefined, locale);
    await open(page, 'P-7');
    const ids = ['second-vote-line', 'requirement-line', 'approval-label', 'casting-note', 'waiting-line'];
    const english = ['Second vote:', 'Requirement:', 'Approval:', 'Yes and no are tied', 'Waiting for'];
    for (const [i, id] of ids.entries()) {
      const text = (await page.getByTestId(id).textContent()) ?? '';
      expect(text, `${locale} ${id}`).not.toMatch(/[{}]/);
      expect(text, `${locale} ${id}`).not.toContain(english[i]);
      expect(text.length, `${locale} ${id}`).toBeGreaterThan(10);
    }
    await page.screenshot({ path: join(OUT, `department-majority-second-vote-${locale}.png`), fullPage: true });
  });
}
