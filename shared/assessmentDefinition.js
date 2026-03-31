const biasLabels = {
  confirmation: "Confirmation Bias",
  anchoring: "Anchoring Bias",
  negativity: "Negativity Bias"
};

const selfPerceptionItems = [
  {
    id: "self_confirmation_1",
    section: "self_perception",
    bias: "confirmation",
    prompt: "I tend to trust information that already fits what I believe.",
    scale: [1, 2, 3, 4, 5]
  },
  {
    id: "self_confirmation_2",
    section: "self_perception",
    bias: "confirmation",
    prompt: "When I have an opinion, I often look for evidence that supports it first.",
    scale: [1, 2, 3, 4, 5]
  },
  {
    id: "self_anchoring_1",
    section: "self_perception",
    bias: "anchoring",
    prompt: "My first impression of a number or idea tends to strongly influence my later judgment.",
    scale: [1, 2, 3, 4, 5]
  },
  {
    id: "self_anchoring_2",
    section: "self_perception",
    bias: "anchoring",
    prompt: "I find it difficult to fully adjust after hearing an initial estimate or suggestion.",
    scale: [1, 2, 3, 4, 5]
  },
  {
    id: "self_negativity_1",
    section: "self_perception",
    bias: "negativity",
    prompt: "Negative possibilities stay with me longer than positive ones.",
    scale: [1, 2, 3, 4, 5]
  },
  {
    id: "self_negativity_2",
    section: "self_perception",
    bias: "negativity",
    prompt: "I usually notice risks and problems before benefits or wins.",
    scale: [1, 2, 3, 4, 5]
  }
];

const scenarioOptions = [
  { value: 1, label: "Very unlikely" },
  { value: 2, label: "Unlikely" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Likely" },
  { value: 5, label: "Very likely" }
];

const scenarioItems = [
  {
    id: "scenario_confirmation_1",
    section: "scenarios",
    bias: "confirmation",
    prompt:
      "Suppose you read one article that supports your current view and one that challenges it. If you revisit only one first, how likely are you to go back to the article that supports your view?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_confirmation_2",
    section: "scenarios",
    bias: "confirmation",
    prompt:
      "A teammate questions your plan for a client delivery with new evidence. How likely are you to look first for data that proves your original plan was right?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_confirmation_3",
    section: "scenarios",
    bias: "confirmation",
    prompt:
      "While choosing between two phones on Flipkart or Amazon, how likely are you to focus on reviews that match your first preference?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.25, 3: 0.5, 4: 0.7, 5: 1.0 }
  },
  {
    id: "scenario_confirmation_4",
    section: "scenarios",
    bias: "confirmation",
    prompt:
      "A family member offers a perspective that challenges your belief on a social issue. How likely are you to dismiss it as an exception?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_anchoring_1",
    section: "scenarios",
    bias: "anchoring",
    prompt:
      "The first salary number in a negotiation is lower than expected. How likely is that first number to keep shaping your next counteroffer?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_anchoring_2",
    section: "scenarios",
    bias: "anchoring",
    prompt:
      "You see the first quoted price from a property broker before comparing other flats. How likely is that opening price to influence what feels reasonable?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_anchoring_3",
    section: "scenarios",
    bias: "anchoring",
    prompt:
      "A manager suggests a delivery deadline before the discussion starts. How likely are you to stay near that date even after new complexity appears?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_anchoring_4",
    section: "scenarios",
    bias: "anchoring",
    prompt:
      "The first explanation you hear for a project issue sounds plausible. How likely are you to judge later evidence mainly through that first explanation?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_negativity_1",
    section: "scenarios",
    bias: "negativity",
    prompt:
      "After a presentation with one criticism and several compliments, how likely are you to keep thinking mostly about the criticism?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.5, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_negativity_2",
    section: "scenarios",
    bias: "negativity",
    prompt:
      "You receive mixed feedback after a campus interview or appraisal. How likely are you to spend more time on the negative comments than the positive ones?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_negativity_3",
    section: "scenarios",
    bias: "negativity",
    prompt:
      "An investment or business opportunity has clear upside but visible risks. How likely are you to feel the risks more strongly than the gains?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  },
  {
    id: "scenario_negativity_4",
    section: "scenarios",
    bias: "negativity",
    prompt:
      "When you think back on a day that had both progress and setbacks, how likely are you to remember the setbacks more vividly?",
    options: scenarioOptions,
    weights: { 1: 0.0, 2: 0.2, 3: 0.45, 4: 0.75, 5: 1.0 }
  }
];

const personalityItems = [
  ["EXT1", "I naturally energize social gatherings at college, work, or family events."],
  ["EXT2", "I usually speak less than other people in group settings."],
  ["EXT3", "I feel comfortable meeting and interacting with new people."],
  ["EXT4", "I prefer to stay in the background during group activities."],
  ["EXT5", "I often start conversations in social or professional settings."],
  ["EXT6", "I usually have very little to add in group discussions."],
  ["EXT7", "I talk with many different people at social gatherings or office events."],
  ["EXT8", "I avoid drawing attention to myself in public settings."],
  ["EXT9", "I am comfortable being the focus of a group discussion when needed."],
  ["EXT10", "I stay quiet around unfamiliar people until they approach me first."],
  ["EST1", "I get stressed out easily."],
  ["EST2", "I am relaxed most of the time."],
  ["EST3", "I worry about things."],
  ["EST4", "I seldom feel blue."],
  ["EST5", "I am easily disturbed."],
  ["EST6", "I get upset easily."],
  ["EST7", "I change my mood a lot."],
  ["EST8", "I have frequent mood swings."],
  ["EST9", "I get irritated easily."],
  ["EST10", "I often feel blue."],
  ["AGR1", "I feel little concern for others."],
  ["AGR2", "I am interested in people."],
  ["AGR3", "I insult people."],
  ["AGR4", "I sympathize with others' feelings."],
  ["AGR5", "I am not interested in other people's problems."],
  ["AGR6", "I have a soft heart."],
  ["AGR7", "I am not really interested in others."],
  ["AGR8", "I take time out for others."],
  ["AGR9", "I feel others' emotions."],
  ["AGR10", "I make people feel at ease."],
  ["CSN1", "I am always prepared."],
  ["CSN2", "I leave my belongings around."],
  ["CSN3", "I pay attention to details."],
  ["CSN4", "I make a mess of things."],
  ["CSN5", "I get chores done right away."],
  ["CSN6", "I often forget to put things back in their proper place."],
  ["CSN7", "I like order."],
  ["CSN8", "I shirk my duties."],
  ["CSN9", "I follow a schedule."],
  ["CSN10", "I am exacting in my work."],
  ["OPN1", "I have a rich vocabulary."],
  ["OPN2", "I have difficulty understanding abstract ideas."],
  ["OPN3", "I have a vivid imagination."],
  ["OPN4", "I am not interested in abstract ideas."],
  ["OPN5", "I have excellent ideas."],
  ["OPN6", "I do not have a good imagination."],
  ["OPN7", "I am quick to understand things."],
  ["OPN8", "I use difficult words."],
  ["OPN9", "I spend time reflecting on things."],
  ["OPN10", "I am full of ideas."]
].map(([id, prompt]) => ({
  id,
  section: "personality",
  prompt,
  scale: [1, 2, 3, 4, 5]
}));

export const assessmentDefinition = {
  version: "1.0.0",
  title: "BiasMirror Cognitive Bias Assessment",
  disclaimer:
    "Model is based on inferred relationships, not direct ground truth labels.",
  biasLabels,
  sections: [
    {
      id: "self_perception",
      title: "Self-perception",
      description:
        "This section captures how you consciously describe your own decision style, habits, and emotional tendencies.",
      items: selfPerceptionItems
    },
    {
      id: "scenarios",
      title: "Behavioral scenarios",
      description:
        "This section uses realistic work, family, and everyday scenarios to estimate how you may react when judgment is under pressure.",
      items: scenarioItems
    },
    {
      id: "personality",
      title: "Personality markers",
      description:
        "This section uses the research-backed IPIP Big Five inventory to estimate underlying personality traits linked to cognitive bias patterns.",
      items: personalityItems
    }
  ]
};

export const personalityReverseKeyMap = {
  EXT: ["EXT2", "EXT4", "EXT6", "EXT8", "EXT10"],
  EST: ["EST2", "EST4"],
  AGR: ["AGR1", "AGR3", "AGR5", "AGR7"],
  CSN: ["CSN2", "CSN4", "CSN6", "CSN8"],
  OPN: ["OPN2", "OPN4", "OPN6"]
};

export const personalityTraitGroups = {
  EXT: personalityItems.filter((item) => item.id.startsWith("EXT")).map((item) => item.id),
  EST: personalityItems.filter((item) => item.id.startsWith("EST")).map((item) => item.id),
  AGR: personalityItems.filter((item) => item.id.startsWith("AGR")).map((item) => item.id),
  CSN: personalityItems.filter((item) => item.id.startsWith("CSN")).map((item) => item.id),
  OPN: personalityItems.filter((item) => item.id.startsWith("OPN")).map((item) => item.id)
};

export const biasOrder = ["confirmation", "anchoring", "negativity"];
