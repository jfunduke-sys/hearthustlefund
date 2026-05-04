"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Athlete } from "@heart-and-hustle/shared";
import {
  replaceCoachFundraiserGroupShells,
  renameCoachFundraiserGroup,
  setCoachFundraiserGroupManager,
  setCoachFundraiserParticipantGroup,
} from "@/app/actions/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CoachGroupRow = {
  id: string;
  name: string;
  sort_order: number;
};

type Props = {
  fundraiserId: string;
  groups: CoachGroupRow[];
  /** athlete id → group id, or null if unassigned */
  memberGroupByAthleteId: Record<string, string | null>;
  /** group id → manager auth user id */
  managerUserIdByGroupId: Record<string, string | null>;
  athletes: Pick<Athlete, "id" | "full_name" | "user_id">[];
};

export default function CoachGroupsSetup({
  fundraiserId,
  groups,
  memberGroupByAthleteId,
  managerUserIdByGroupId,
  athletes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shellCount, setShellCount] = useState(() =>
    String(Math.max(1, groups.length || 2))
  );
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setNameDraft((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (next[g.id] === undefined) next[g.id] = g.name;
      }
      for (const id of Object.keys(next)) {
        if (!groups.some((g) => g.id === id)) delete next[id];
      }
      return next;
    });
  }, [groups]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [groups]
  );

  const managerCandidates = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of athletes) {
      if (a.user_id) m.set(a.user_id, a.full_name);
    }
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [athletes]);

  function runReplace() {
    const n = parseInt(shellCount, 10);
    if (!Number.isFinite(n) || n < 1 || n > 25) {
      setMsg("Enter a number of groups between 1 and 25.");
      return;
    }
    setMsg(null);
    startTransition(async () => {
      try {
        await replaceCoachFundraiserGroupShells({
          fundraiserId,
          groupCount: n,
        });
        setReplaceOpen(false);
        router.refresh();
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : "Could not update groups.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        Group setup
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Create teams, assign each participant to one group, and pick one group
        manager per group (they need an app account on this campaign). Replacing
        the number of groups clears all placements and manager assignments.
      </p>

      {msg ? (
        <p className="mt-3 text-sm text-red-700" role="status">
          {msg}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="group-shell-count" className="text-xs">
            Number of groups
          </Label>
          <Input
            id="group-shell-count"
            type="text"
            inputMode="numeric"
            className="h-9 w-24"
            value={shellCount}
            onChange={(e) => setShellCount(e.target.value.replace(/\D/g, ""))}
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            if (groups.length > 0) setReplaceOpen(true);
            else runReplace();
          }}
        >
          {groups.length > 0 ? "Replace all groups…" : "Create groups"}
        </Button>
      </div>

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace all groups?</DialogTitle>
            <DialogDescription>
              This removes every group&apos;s name, all participant placements, and
              all group manager assignments, then creates the new empty groups.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReplaceOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={() => runReplace()}>
              {pending ? "Working…" : "Replace groups"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedGroups.length > 0 ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Group names and managers
          </p>
          <ul className="space-y-3">
            {sortedGroups.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs text-slate-600">Group name</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      className="h-9 max-w-xs"
                      value={nameDraft[g.id] ?? g.name}
                      onChange={(e) =>
                        setNameDraft((d) => ({ ...d, [g.id]: e.target.value }))
                      }
                      disabled={pending}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        const nm = (nameDraft[g.id] ?? g.name).trim();
                        setMsg(null);
                        startTransition(async () => {
                          try {
                            await renameCoachFundraiserGroup({
                              fundraiserId,
                              groupId: g.id,
                              name: nm,
                            });
                            router.refresh();
                          } catch (e: unknown) {
                            setMsg(
                              e instanceof Error ? e.message : "Could not save name."
                            );
                          }
                        });
                      }}
                    >
                      Save name
                    </Button>
                  </div>
                </div>
                <div className="min-w-[12rem] space-y-1 sm:min-w-[14rem]">
                  <Label className="text-xs text-slate-600">Group manager</Label>
                  <select
                    className="h-9 w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 text-sm"
                    disabled={pending}
                    value={managerUserIdByGroupId[g.id] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const uid = v === "" ? null : v;
                      setMsg(null);
                      startTransition(async () => {
                        try {
                          await setCoachFundraiserGroupManager({
                            fundraiserId,
                            groupId: g.id,
                            managerUserId: uid,
                          });
                          router.refresh();
                        } catch (err: unknown) {
                          setMsg(
                            err instanceof Error
                              ? err.message
                              : "Could not set manager."
                          );
                        }
                      });
                    }}
                  >
                    <option value="">None</option>
                    {managerCandidates.map(([uid, label]) => (
                      <option key={uid} value={uid}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sortedGroups.length > 0 && athletes.length > 0 ? (
        <div className="mt-8 overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Participant → group
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...athletes]
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.full_name}</TableCell>
                    <TableCell>
                      <select
                        className="h-9 w-full min-w-[10rem] max-w-xs rounded-md border border-slate-300 bg-white px-2 text-sm"
                        disabled={pending}
                        value={memberGroupByAthleteId[a.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const gid = v === "" ? null : v;
                          setMsg(null);
                          startTransition(async () => {
                            try {
                              await setCoachFundraiserParticipantGroup({
                                fundraiserId,
                                athleteId: a.id,
                                groupId: gid,
                              });
                              router.refresh();
                            } catch (err: unknown) {
                              setMsg(
                                err instanceof Error
                                  ? err.message
                                  : "Could not assign group."
                              );
                            }
                          });
                        }}
                      >
                        <option value="">Not in a group</option>
                        {sortedGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {nameDraft[g.id] ?? g.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
