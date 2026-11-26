"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillBar } from "@/components/ui/skill-bar";
import { MAX_PROFILE_SKILLS, SKILL_LEVEL_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { Skill } from "@/types/db";

type Row = { skill_id: string; level: number };

const LEVELS = [1, 2, 3, 4, 5];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
}

export function SkillEditor({
  catalog,
  initial,
}: {
  catalog: Skill[];
  initial: Row[];
}) {
  const catalogIds = useMemo(
    () => new Set(catalog.map((skill) => skill.id)),
    [catalog],
  );
  const [rows, setRows] = useState<Row[]>(
    initial
      .filter((row) => catalogIds.has(row.skill_id))
      .slice(0, MAX_PROFILE_SKILLS),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const used = new Set(rows.map((row) => row.skill_id));
  const available = catalog.filter((skill) => !used.has(skill.id));
  const search = normalize(query.trim());
  const matches = search
    ? available.filter((skill) =>
        normalize(`${skill.name} ${skill.category ?? ""}`).includes(search),
      )
    : available;
  const canAdd = rows.length < MAX_PROFILE_SKILLS && available.length > 0;
  const initialKey = useMemo(
    () =>
      JSON.stringify(
        initial
          .filter((row) => catalogIds.has(row.skill_id))
          .slice(0, MAX_PROFILE_SKILLS),
      ),
    [initial, catalogIds],
  );
  const dirty = JSON.stringify(rows) !== initialKey;

  function add(skillId: string) {
    if (
      rows.length >= MAX_PROFILE_SKILLS ||
      rows.some((row) => row.skill_id === skillId)
    ) {
      return;
    }

    setRows((current) => [...current, { skill_id: skillId, level: 3 }]);
    setQuery("");

    if (rows.length + 1 >= MAX_PROFILE_SKILLS) {
      setPickerOpen(false);
    }
  }

  function updateLevel(index: number, level: number) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, level } : row,
      ),
    );
  }

  function remove(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="skills" value={JSON.stringify(rows)} />
      <input type="hidden" name="skills_dirty" value={dirty ? "1" : "0"} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant" aria-live="polite">
          <span className="font-medium tabular-nums text-on-surface">
            {rows.length}
          </span>
          /{MAX_PROFILE_SKILLS} kỹ năng đã chọn
        </p>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="h-11 px-5"
          aria-expanded={pickerOpen}
          aria-controls={pickerOpen ? "skill-picker" : undefined}
          onClick={() => setPickerOpen((open) => !open)}
          disabled={!canAdd && !pickerOpen}
        >
          {pickerOpen ? (
            <>
              <X className="h-4 w-4" aria-hidden />
              Đóng
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Thêm kỹ năng
            </>
          )}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center">
          <p className="text-sm font-medium text-on-surface">
            Chưa chọn kỹ năng
          </p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            Thêm tối đa {MAX_PROFILE_SKILLS} kỹ năng để đội khác biết bạn mạnh ở
            đâu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const skill = catalog.find((item) => item.id === row.skill_id);
            const name = skill?.name ?? "Kỹ năng";
            const levelLabel = SKILL_LEVEL_LABEL[row.level] ?? "";

            return (
              <li
                key={row.skill_id}
                className="rounded-xl border border-outline-variant bg-surface p-4"
              >
                <div className="flex items-start gap-2">
                  <SkillBar
                    name={name}
                    level={row.level}
                    category={skill?.category}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Bỏ kỹ năng ${name}`}
                    onClick={() => remove(index)}
                    className="-mr-2 -mt-2 h-11 w-11 shrink-0 p-0 hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>

                <fieldset className="mt-4">
                  <legend className="sr-only">Mức độ cho {name}</legend>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-on-surface-variant">
                      Mức độ
                    </span>
                    <span className="text-xs font-medium text-on-surface">
                      {levelLabel}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {LEVELS.map((level) => {
                      const selected = row.level === level;

                      return (
                        <label
                          key={level}
                          className={cn(
                            "flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface",
                            selected
                              ? "border-primary bg-primary-container text-on-primary-container"
                              : "border-outline-variant text-on-surface-variant hover:bg-surface-container",
                          )}
                        >
                          <input
                            type="radio"
                            name={`level-${row.skill_id}`}
                            value={level}
                            checked={selected}
                            onChange={() => updateLevel(index, level)}
                            className="sr-only"
                          />
                          <span aria-hidden>{level}</span>
                          <span className="sr-only">
                            {level} · {SKILL_LEVEL_LABEL[level]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ul>
      )}

      {pickerOpen && canAdd ? (
        <div
          id="skill-picker"
          className="rounded-xl border border-outline-variant bg-surface-container p-3"
        >
          <label htmlFor="skill-search" className="sr-only">
            Tìm kỹ năng
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              aria-hidden
            />
            <Input
              id="skill-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc nhóm kỹ năng…"
              className="bg-surface pl-11"
              autoFocus
            />
          </div>

          {matches.length > 0 ? (
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {matches.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={() => add(skill.id)}
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg bg-surface px-3 py-2 text-left transition-colors hover:bg-primary-container/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-on-surface">
                        {skill.name}
                      </span>
                      {skill.category ? (
                        <span className="block truncate text-xs text-on-surface-variant">
                          {skill.category}
                        </span>
                      ) : null}
                    </span>
                    <Plus
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="sr-only">Thêm {skill.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-on-surface-variant">
              Không tìm thấy kỹ năng phù hợp.
            </p>
          )}

          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            Còn {MAX_PROFILE_SKILLS - rows.length} lượt chọn.
          </p>
        </div>
      ) : null}

      {catalog.length === 0 ? (
        <p className="text-xs leading-5 text-on-surface-variant">
          BTC chưa cấu hình danh mục kỹ năng.
        </p>
      ) : rows.length < MAX_PROFILE_SKILLS && available.length === 0 ? (
        <p className="text-xs leading-5 text-on-surface-variant">
          Bạn đã chọn tất cả kỹ năng trong danh mục.
        </p>
      ) : null}

      {rows.length >= MAX_PROFILE_SKILLS ? (
        <p className="text-xs leading-5 text-on-surface-variant">
          Bạn đã chọn tối đa {MAX_PROFILE_SKILLS} kỹ năng. Bỏ bớt một kỹ năng để
          thay đổi.
        </p>
      ) : null}
    </div>
  );
}
