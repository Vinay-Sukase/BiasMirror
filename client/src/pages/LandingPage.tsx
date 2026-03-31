import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pillars = [
  {
    icon: BrainCircuit,
    title: "Psychometrics + behavior",
    copy: "BiasMirror blends self-perception, scenario judgments, and Big Five markers into one explainable cognitive profile."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Track change over time",
    copy: "Every completed session becomes a trend point, making it easier to spot recurring mental shortcuts before they harden."
  },
  {
    icon: ShieldCheck,
    title: "Transparent science",
    copy: "Scores are model-assisted and clearly labeled as inferred, not ground-truth diagnoses, so the platform stays honest about its limits."
  }
];

export function LandingPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(154,124,255,0.32),_transparent_42%),rgba(255,255,255,0.08)]">
          <Badge className="mb-6">Research-grade SaaS</Badge>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl text-5xl font-semibold leading-tight"
          >
            Understand how your mind leans before your next decision asks too much of it.
          </motion.h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-haze">
            BiasMirror estimates confirmation, anchoring, and negativity patterns from real assessments,
            measured timing data, and a psychometrically grounded Big Five inventory.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/assessment">
              <Button>
                Start assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">View dashboard</Button>
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-haze">What you get</p>
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-3xl font-semibold">68 structured prompts</h3>
                <p className="mt-2 text-haze">6 self-perception items, 12 scenarios, and the full 50-item IPIP inventory.</p>
              </div>
              <div>
                <h3 className="text-3xl font-semibold">Explainable scoring</h3>
                <p className="mt-2 text-haze">Trait and timing contributors stay visible so the model never becomes a black box.</p>
              </div>
              <div>
                <h3 className="text-3xl font-semibold">Longitudinal reflection</h3>
                <p className="mt-2 text-haze">Trend lines, gap analysis, and reflection prompts help translate analytics into action.</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
            >
              <Card className="h-full">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                  <Icon className="h-6 w-6 text-haze" />
                </div>
                <h3 className="text-xl font-semibold">{pillar.title}</h3>
                <p className="mt-3 leading-7 text-haze">{pillar.copy}</p>
              </Card>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
