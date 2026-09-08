"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeading, Select,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Role, User } from "@/lib/types";

const ROLES: Role[] = ["admin", "manager", "operator", "viewer"];

const ROLE_RIGHTS: Record<Role, string[]> = {
  admin: ["Everything below", "User & access management", "System settings", "Data reset"],
  manager: ["Defect records (full CRUD)", "Machines & IoT devices", "Analytics & reports", "Send reports to buyers"],
  operator: ["Live inspection controls", "Log & edit defects", "View machines and devices", "View analytics"],
  viewer: ["Read-only reports", "Read-only compliance data", "No editing anywhere"],
};

const COLORS = ["#19c6ad", "#f3ae43", "#8d78eb", "#ea6571", "#5b9dd9", "#e8845f"];

const blank = (): User => ({
  id: "",
  name: "",
  email: "",
  password: "",
  role: "operator",
  department: "",
  avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  active: true,
  createdAt: new Date().toISOString(),
});

export default function UsersPage() {
  const { users, addUser, updateUser, removeUser, currentUser } = useStore();
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  return (
    <div>
      <PageHeading
        eyebrow="Admin"
        title="Users & access"
        description="Four roles, each scoped to what that person actually does on the floor. The buyer role exists so an external auditor can be given read-only access to compliance data without seeing the rest of the plant."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={15} /> Add user
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Accounts" subtitle={`${users.length} users`} />
          <div className="divide-y divide-white/5">
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-wrap items-center gap-4 px-5 py-4"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[13px] font-bold text-[#06131c]"
                  style={{ background: u.avatarColor }}
                >
                  {u.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-40 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-white">{u.name}</p>
                    {u.id === currentUser?.id ? <Badge tone="teal">You</Badge> : null}
                    {!u.active ? <Badge tone="danger">Deactivated</Badge> : null}
                  </div>
                  <p className="font-mono text-[11px] text-slate-500">{u.email}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {u.department} · joined {formatDate(u.createdAt)}
                  </p>
                </div>

                <Badge
                  tone={
                    u.role === "admin"
                      ? "danger"
                      : u.role === "manager"
                        ? "amber"
                        : u.role === "operator"
                          ? "violet"
                          : "slate"
                  }
                >
                  <ShieldCheck size={11} /> {u.role}
                </Badge>

                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(u)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white/8 hover:text-teal"
                    aria-label="Edit user"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(u)}
                    disabled={u.id === currentUser?.id}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white/8 hover:text-[#e05c68] disabled:opacity-30"
                    aria-label="Remove user"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="What each role can do" />
          <div className="space-y-4 p-5 pt-4">
            {ROLES.map((r) => (
              <div key={r} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <p className="text-[13px] font-semibold capitalize text-white">{r}</p>
                <ul className="mt-2 space-y-1">
                  {ROLE_RIGHTS[r].map((x) => (
                    <li key={x} className="flex gap-2 text-[12px] leading-relaxed text-slate-400">
                      <span className="text-teal">·</span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <UserForm
        open={!!editing}
        user={editing}
        onClose={() => setEditing(null)}
        onSave={(u) => {
          updateUser(u.id, u);
          setEditing(null);
        }}
      />
      <UserForm
        open={creating}
        user={creating ? blank() : null}
        isNew
        onClose={() => setCreating(false)}
        onSave={(u) => {
          addUser({ ...u, id: `U-${Math.floor(Math.random() * 800 + 100)}` });
          setCreating(false);
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove this account?"
        subtitle={confirmDelete?.email}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) removeUser(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              <Trash2 size={15} /> Remove user
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-400">
          Defect records and reports authored by this person are kept. If you only need to revoke
          access, deactivating the account preserves the audit trail better than deleting it.
        </p>
      </Modal>
    </div>
  );
}

function UserForm({
  open, user, isNew, onClose, onSave,
}: {
  open: boolean;
  user: User | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [draft, setDraft] = useState<User | null>(user);
  const [key, setKey] = useState("");
  const identity = `${user?.id}-${open}`;
  if (identity !== key) {
    setKey(identity);
    setDraft(user);
  }
  if (!draft) return null;

  const set = <K extends keyof User>(k: K, v: User[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const valid = draft.name.trim() && draft.email.includes("@") && draft.password.length >= 5;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? "Add a user" : draft.name}
      subtitle={isNew ? "Credentials work immediately on the sign-in page." : draft.email}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => onSave(draft)}>
            {isNew ? "Create account" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input
            type="email" value={draft.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Password" hint="Minimum 5 characters">
          <Input value={draft.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={draft.role} onChange={(e) => set("role", e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Department">
          <Input
            value={draft.department}
            placeholder="Quality Assurance"
            onChange={(e) => set("department", e.target.value)}
          />
        </Field>
        <Field label="Avatar colour" className="sm:col-span-2">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("avatarColor", c)}
                className={`h-9 w-9 rounded-lg transition ${
                  draft.avatarColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0d1f31]" : ""
                }`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
        </Field>
        <Field label="Account status" className="sm:col-span-2">
          <Select
            value={draft.active ? "active" : "inactive"}
            onChange={(e) => set("active", e.target.value === "active")}
          >
            <option value="active">Active — can sign in</option>
            <option value="inactive">Deactivated — sign-in blocked</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
