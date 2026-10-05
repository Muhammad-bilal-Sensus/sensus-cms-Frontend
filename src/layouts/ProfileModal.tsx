import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { Icon } from "./icons";

const languages = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const maxPictureBytes = 10 * 1024 * 1024;

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, logout, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [picture, setPicture] = useState<string | undefined>();
  const [city, setCity] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [language, setLanguage] = useState("en");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [seenOpen, setSeenOpen] = useState(open);

  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open && user) {
      setName(user.name);
      setPicture(user.picture);
      setCity(user.city ?? "");
      setTimeZone(user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      setLanguage(user.language || "en");
      setLanguageOpen(false);
      setPictureError(null);
      setNameError(null);
      setLocationError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !user) return null;

  const initial = (name.trim() || user.name).slice(0, 1).toUpperCase() || "A";

  function onPicture(file: File | undefined) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setPictureError("Use a JPG, PNG, or SVG file.");
      return;
    }
    if (file.size > maxPictureBytes) {
      setPictureError("Picture must be 10 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPicture(typeof reader.result === "string" ? reader.result : undefined);
      setPictureError(null);
    };
    reader.readAsDataURL(file);
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setLocationError("This browser cannot read your location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimeZone(zone);
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
          );
          const data = (await response.json()) as { city?: string; locality?: string; principalSubdivision?: string };
          setCity(data.city || data.locality || data.principalSubdivision || "");
        } catch {
          setLocationError("Timezone was set. The city could not be detected.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationError("Allow location access, then try again.");
      },
    );
  }

  function submit() {
    const nextName = name.trim();
    if (!nextName) {
      setNameError("Enter your name.");
      return;
    }
    updateProfile({
      email: user?.email ?? "",
      name: nextName,
      picture,
      city: city || undefined,
      timeZone: timeZone || undefined,
      language,
    });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="profile-title" className="text-sm font-semibold text-slate-900">
              Update Profile
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Update Information Below here.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="primary" background="#111111" height={32} className="px-3 text-xs" onClick={() => setLanguageOpen((value) => !value)}>
                Language
                <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9Z" />
                </svg>
              </Button>
              {languageOpen ? (
                <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {languages.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setLanguage(item.value);
                        setLanguageOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${language === item.value ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              variant="primary"
              background="#111111"
              height={32}
              className="px-3 text-xs"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              Logout
              <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
                <path d="M15 12H3" />
                <path d="m6 9-3 3 3 3" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[168px_1fr]">
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="relative mx-auto block h-24 w-24" aria-label="Change picture">
              {picture ? (
                <img src={picture} alt="" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#8fd0c6] text-3xl font-medium text-white">{initial}</span>
              )}
              <span className="absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml,.jpg,.jpeg,.png,.svg"
              className="hidden"
              onChange={(event) => {
                onPicture(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <p className="mt-2 text-center text-[10px] whitespace-nowrap text-slate-500">JPG, PNG, SVG • Max size 10 MB</p>
            {pictureError ? <p className="mt-1 text-center text-xs text-red-600">{pictureError}</p> : null}
            <div className="mt-2">
              <Button variant="primary" background="#111111" width="100%" height={32} className="px-3 text-xs" onClick={() => setPicture(undefined)} disabled={!picture}>
                Remove Picture
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-800">
                Name <span className="text-red-500">*</span>
              </span>
              <Input className="mt-1 h-9 text-xs" value={name} onChange={setName} />
              {nameError ? <span className="mt-1 block text-xs text-red-600">{nameError}</span> : null}
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-800">
                Email <span className="text-red-500">*</span>
              </span>
              <Input className="mt-1 h-9 bg-slate-100 text-xs" value={user.email} onChange={() => undefined} disabled />
            </label>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Location & Timezone</h3>
              <p className="mt-0.5 text-xs text-slate-400">Select your location and timezone</p>
            </div>
            <Button variant="primary" background="#111111" height={32} className="px-3 text-xs" onClick={getLocation} disabled={locating}>
              {locating ? "Locating..." : "Get Location"}
              <Icon name="pin" className="ml-2 h-4 w-4" />
            </Button>
          </div>
          {locationError ? <p className="mt-3 text-xs text-red-600">{locationError}</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-[#eef8f4] px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700">
                <Icon name="pin" className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-slate-500">DETECTED CITY</p>
                <p className="text-sm font-semibold text-slate-900">{city || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#eef8f4] px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9Z" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-slate-500">YOUR TIME ZONE:</p>
                <p className="text-sm font-semibold text-slate-900">{timeZone || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="primary" background="#111111" height={32} className="px-4 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" background="#111111" height={32} className="px-4 text-xs" onClick={submit}>
            Submit
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
