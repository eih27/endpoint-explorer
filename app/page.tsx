"use client";

import { Disclaimer } from "@/components/Disclaimer";
import { EndpointDefinitionCompare } from "@/components/EndpointDefinitionCompare";
import { EndpointHealthPanel } from "@/components/EndpointHealthPanel";
import { EndpointTrajectoryChart } from "@/components/EndpointTrajectoryChart";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { MissingDataView } from "@/components/MissingDataView";
import { ParticipantDistribution } from "@/components/ParticipantDistribution";
import { ParticipantDrawer } from "@/components/ParticipantDrawer";
import { ParticipantExplorer } from "@/components/ParticipantExplorer";
import { PlaceboResponseExplorer } from "@/components/PlaceboResponseExplorer";
import { SiteBreakdown } from "@/components/SiteBreakdown";
import { Section } from "@/components/ui/primitives";
import { StudySummary } from "@/components/StudySummary";
import {
  healthSignals,
  retention,
  siteBreakdown,
  studySummary,
  trajectory,
  week8Distribution,
  type RetentionScope,
} from "@/lib/analysis";
import { getStudy } from "@/lib/synth";
import type { Participant } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const [studyId, setStudyId] = useState("aurora-201");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [retentionScope, setRetentionScope] = useState<RetentionScope>("overall");
  const [showBand, setShowBand] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    const t = setTimeout(() => setLoading(false), 620);
    return () => clearTimeout(t);
  }, [studyId]);

  const model = useMemo(() => {
    const study = getStudy(studyId);
    return {
      study,
      summary: studySummary(study),
      traj: trajectory(study),
      signals: healthSignals(study),
      dist: week8Distribution(study),
      retentionOverall: retention(study, "overall"),
      retentionTreatment: retention(study, "treatment"),
      retentionPlacebo: retention(study, "placebo"),
      sites: siteBreakdown(study),
    };
  }, [studyId]);

  const retentionSteps =
    retentionScope === "treatment"
      ? model.retentionTreatment
      : retentionScope === "placebo"
        ? model.retentionPlacebo
        : model.retentionOverall;

  return (
    <div className="min-h-screen">
      <Header studyId={studyId} onStudyChange={setStudyId} />

      <main className="mx-auto max-w-6xl px-5 py-8">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="ee-fade space-y-2">
            <div className="mb-8">
              <div className="mb-1 text-2xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                {model.study.config.code} · {model.study.config.indication}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Is this endpoint giving us a clean, interpretable signal?
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft">
                Primary endpoint: {model.study.config.scaleName} ({model.study.config.scaleAcronym}),
                total score {model.study.config.scaleRange[0]}&ndash;{model.study.config.scaleRange[1]}
                . Lower scores indicate fewer symptoms.
              </p>
            </div>

            <div className="pb-2">
              <StudySummary summary={model.summary} config={model.study.config} />
            </div>

            <Section
              id="trajectory"
              eyebrow="What is happening?"
              title="Endpoint trajectory"
              question="Mean symptom score over time, treatment vs placebo."
            >
              <EndpointTrajectoryChart
                traj={model.traj}
                config={model.study.config}
                showBand={showBand}
                onToggleBand={setShowBand}
              />
            </Section>

            <Section
              id="health"
              eyebrow="What should I look at?"
              title="Endpoint health panel"
              question="Four deterministic observations from this synthetic dataset — phrased as observations, not clinical conclusions."
            >
              <EndpointHealthPanel signals={model.signals} />
            </Section>

            <Section
              id="distribution"
              eyebrow="Is the average hiding important variation?"
              title="Participant distribution at Week 8"
              question="Distribution of participant-level change from baseline, by arm."
            >
              <ParticipantDistribution
                dist={model.dist}
                scaleAcronym={model.study.config.scaleAcronym}
              />
            </Section>

            <Section
              id="placebo"
              eyebrow="Could placebo response be obscuring the picture?"
              title="Placebo response explorer"
              question="How much of the placebo arm counts as 'improved' depends on the window and threshold."
            >
              <PlaceboResponseExplorer study={model.study} />
            </Section>

            <Section
              id="missing"
              eyebrow="Are we losing participants?"
              title="Missing data & retention"
              question="Observed records at each visit, overall and by arm."
            >
              <MissingDataView
                scope={retentionScope}
                onScopeChange={setRetentionScope}
                steps={retentionSteps}
                treatmentSteps={model.retentionTreatment}
                placeboSteps={model.retentionPlacebo}
              />
            </Section>

            <Section
              id="sites"
              eyebrow="Is anything site-specific going on?"
              title="Site-level breakdown"
              question="Enrollment, completion, and mean change by site — small samples, so read differences as a prompt to look closer, not proof of a site issue."
            >
              <SiteBreakdown rows={model.sites} />
            </Section>

            <Section
              id="participants"
              eyebrow="From aggregate to individual"
              title="Participant explorer"
              question="Sort and filter synthetic participants; open one to see its own trajectory."
            >
              <ParticipantExplorer study={model.study} onSelect={setSelected} />
            </Section>

            <Section
              id="definitions"
              eyebrow="Does changing how we express the endpoint change what we notice?"
              title="Compare endpoint definitions"
              question="The same underlying data, viewed three ways."
            >
              <EndpointDefinitionCompare study={model.study} />
            </Section>

            <div className="pt-10">
              <Disclaimer />
            </div>
          </div>
        )}
      </main>

      <ParticipantDrawer
        study={model.study}
        participant={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
