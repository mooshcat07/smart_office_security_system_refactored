"use client"

import * as React from "react"
import {
  CalendarDaysIcon,
  ClockIcon,
  SaveIcon,
  Trash2Icon,
  PlusIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/convex/_generated/api"

// ── Lightweight month calendar (no extra deps) ────────────────────────────────
function MonthCalendar({
  selected,
  onSelect,
  markedDates,
}: {
  selected: string | null // YYYY-MM-DD
  onSelect: (date: string) => void
  markedDates: Set<string>
}) {
  const [cursor, setCursor] = React.useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthLabel = cursor.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  })

  function toKey(day: number) {
    const m = String(month + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${year}-${m}-${d}`
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          ‹
        </Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          ›
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e-${i}`} />
          }
          const key = toKey(day)
          const isSelected = selected === key
          const isMarked = markedDates.has(key)
          const isToday =
            key ===
            new Date().toISOString().slice(0, 10) // approx local; fine for UI highlight

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={[
                "relative h-9 rounded-md text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                isToday && !isSelected ? "ring-1 ring-primary/40" : "",
              ].join(" ")}
            >
              {day}
              {isMarked && !isSelected && (
                <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-orange-500" />
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Orange dot = day has a custom override
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const settings = useQuery(api.settings.queries.getWorkingHoursSettings)
  const overrides = useQuery(api.settings.queries.getDateOverrides)
  const status = useQuery(api.settings.queries.getCurrentScheduleStatus, {})

  const ensureDefaults = useMutation(
    api.settings.mutations.ensureDefaultWorkingHours,
  )
  const upsertHours = useMutation(
    api.settings.mutations.upsertWorkingHoursSettings,
  )
  const upsertOverride = useMutation(api.settings.mutations.upsertDateOverride)
  const deleteOverride = useMutation(api.settings.mutations.deleteDateOverride)

  // Seed defaults once if missing
  React.useEffect(() => {
    if (settings && settings.exists === false) {
      ensureDefaults({}).catch(console.error)
    }
  }, [settings, ensureDefaults])

  const [weekdayStart, setWeekdayStart] = React.useState("07:30")
  const [weekdayEnd, setWeekdayEnd] = React.useState("18:00")
  const [weekendStart, setWeekendStart] = React.useState("08:00")
  const [weekendEnd, setWeekendEnd] = React.useState("12:00")
  const [savingHours, setSavingHours] = React.useState(false)

  React.useEffect(() => {
    if (!settings) return
    setWeekdayStart(settings.weekdayStart)
    setWeekdayEnd(settings.weekdayEnd)
    setWeekendStart(settings.weekendStart)
    setWeekendEnd(settings.weekendEnd)
  }, [settings])

  // Override form state
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [ovClosed, setOvClosed] = React.useState(false)
  const [ovStart, setOvStart] = React.useState("08:00")
  const [ovEnd, setOvEnd] = React.useState("12:00")
  const [ovLabel, setOvLabel] = React.useState("")
  const [savingOverride, setSavingOverride] = React.useState(false)

  const markedDates = React.useMemo(() => {
    const s = new Set<string>()
    for (const o of overrides ?? []) s.add(o.date)
    return s
  }, [overrides])

  // When user picks a date, load existing override if any
  React.useEffect(() => {
    if (!selectedDate || !overrides) return
    const existing = overrides.find((o) => o.date === selectedDate)
    if (existing) {
      setOvClosed(existing.closed)
      setOvStart(existing.start ?? "08:00")
      setOvEnd(existing.end ?? "12:00")
      setOvLabel(existing.label ?? "")
    } else {
      setOvClosed(false)
      setOvStart("08:00")
      setOvEnd("12:00")
      setOvLabel("")
    }
  }, [selectedDate, overrides])

  async function handleSaveHours() {
    setSavingHours(true)
    try {
      await upsertHours({
        weekdayStart,
        weekdayEnd,
        weekendStart,
        weekendEnd,
      })
      toast.success("Working hours saved")
    } catch (e) {
      console.error(e)
      toast.error("Failed to save working hours")
    } finally {
      setSavingHours(false)
    }
  }

  async function handleSaveOverride() {
    if (!selectedDate) return
    setSavingOverride(true)
    try {
      await upsertOverride({
        date: selectedDate,
        closed: ovClosed,
        start: ovClosed ? undefined : ovStart,
        end: ovClosed ? undefined : ovEnd,
        label: ovLabel.trim() || undefined,
      })
      toast.success(
        ovClosed
          ? `Marked ${selectedDate} as closed`
          : `Override saved for ${selectedDate}`,
      )
    } catch (e) {
      console.error(e)
      toast.error("Failed to save override")
    } finally {
      setSavingOverride(false)
    }
  }

  async function handleDeleteOverride() {
    if (!selectedDate) return
    try {
      await deleteOverride({ date: selectedDate })
      toast.success(`Removed override for ${selectedDate}`)
      setOvClosed(false)
      setOvLabel("")
    } catch (e) {
      console.error(e)
      toast.error("Failed to remove override")
    }
  }

  const selectedHasOverride =
    selectedDate != null && markedDates.has(selectedDate)

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure working hours. Motion outside these windows raises an alarm.
        </p>
      </div>

      {/* Live status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClockIcon className="size-4" />
            Current status
          </CardTitle>
          <CardDescription>
            Based on CAT (UTC+2) and your schedule below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="flex flex-wrap items-center gap-3">
              {status.afterHours ? (
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30"
                >
                  <AlertTriangleIcon className="size-3 mr-1" />
                  After hours — motion will alarm
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
                >
                  <CheckCircleIcon className="size-3 mr-1" />
                  Within working hours
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Today ({status.date}):{" "}
                {status.schedule.closed
                  ? `Closed${status.schedule.label ? ` — ${status.schedule.label}` : ""}`
                  : `${status.schedule.start} – ${status.schedule.end}`}{" "}
                <span className="text-xs">({status.schedule.source})</span>
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Loading…</span>
          )}
        </CardContent>
      </Card>

      {/* Default hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default working hours</CardTitle>
          <CardDescription>
            Monday–Friday and Saturday–Sunday defaults (CAT). Admins can still
            extend a specific day with a date override.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Monday – Friday</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="wd-start" className="text-xs">
                    Start
                  </Label>
                  <Input
                    id="wd-start"
                    type="time"
                    value={weekdayStart}
                    onChange={(e) => setWeekdayStart(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="wd-end" className="text-xs">
                    End
                  </Label>
                  <Input
                    id="wd-end"
                    type="time"
                    value={weekdayEnd}
                    onChange={(e) => setWeekdayEnd(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Saturday – Sunday</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="we-start" className="text-xs">
                    Start
                  </Label>
                  <Input
                    id="we-start"
                    type="time"
                    value={weekendStart}
                    onChange={(e) => setWeekendStart(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="we-end" className="text-xs">
                    End
                  </Label>
                  <Input
                    id="we-end"
                    type="time"
                    value={weekendEnd}
                    onChange={(e) => setWeekendEnd(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveHours} disabled={savingHours}>
            <SaveIcon className="size-4" />
            {savingHours ? "Saving…" : "Save default hours"}
          </Button>
        </CardContent>
      </Card>

      {/* Date overrides + calendar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDaysIcon className="size-4" />
              Calendar
            </CardTitle>
            <CardDescription>
              Select a day to set a public holiday, shortened hours, or an
              extended shift.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthCalendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              markedDates={markedDates}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate
                ? `Override for ${selectedDate}`
                : "Date override"}
            </CardTitle>
            <CardDescription>
              {selectedDate
                ? "Leave as default, mark closed, or set custom hours for this day only."
                : "Pick a date on the calendar first."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                No date selected.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="closed"
                    checked={ovClosed}
                    onCheckedChange={(v) => setOvClosed(v === true)}
                  />
                  <Label htmlFor="closed" className="text-sm font-normal">
                    Closed all day (public holiday / no access expected)
                  </Label>
                </div>

                {!ovClosed && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="time"
                        value={ovStart}
                        onChange={(e) => setOvStart(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">End</Label>
                      <Input
                        type="time"
                        value={ovEnd}
                        onChange={(e) => setOvEnd(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Label (optional)</Label>
                  <Input
                    placeholder="e.g. Public Holiday, Extended shift"
                    value={ovLabel}
                    onChange={(e) => setOvLabel(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={handleSaveOverride}
                    disabled={savingOverride}
                  >
                    <PlusIcon className="size-4" />
                    {selectedHasOverride ? "Update override" : "Save override"}
                  </Button>
                  {selectedHasOverride && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteOverride}
                      className="text-destructive border-destructive/30"
                    >
                      <Trash2Icon className="size-4" />
                      Remove override
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Existing overrides list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved overrides</CardTitle>
          <CardDescription>
            Days that differ from the weekday / weekend defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!overrides ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No date overrides yet.
            </p>
          ) : (
            <div className="rounded-md border divide-y">
              {overrides.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
                  onClick={() => setSelectedDate(o.date)}
                >
                  <div>
                    <span className="font-medium">{o.date}</span>
                    {o.label && (
                      <span className="ml-2 text-muted-foreground">
                        — {o.label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o.closed ? (
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-300"
                      >
                        Closed
                      </Badge>
                    ) : (
                      <span>
                        {o.start} – {o.end}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
