import { describe, expect, it } from "vitest";
import { calculerCreneaux } from "./creneaux";

const dispoOuverte = { ouvert: true, heureDebut: "10:00", heureFin: "13:00" };

describe("calculerCreneaux", () => {
  it("ne propose rien un jour fermé", () => {
    const slots = calculerCreneaux({
      dureeMinutes: 60,
      battementMinutes: 0,
      dispoJour: { ouvert: false, heureDebut: "10:00", heureFin: "18:00" },
      indisponibilites: [],
      reservationsExistantes: [],
    });
    expect(slots).toEqual([]);
  });

  it("ne propose rien si une indisponibilité couvre la journée entière", () => {
    const slots = calculerCreneaux({
      dureeMinutes: 60,
      battementMinutes: 0,
      dispoJour: dispoOuverte,
      indisponibilites: [{ heureDebut: null, heureFin: null }],
      reservationsExistantes: [],
    });
    expect(slots).toEqual([]);
  });

  it("bloque uniquement la plage horaire d'une indisponibilité partielle", () => {
    const slots = calculerCreneaux({
      dureeMinutes: 60,
      battementMinutes: 0,
      dispoJour: dispoOuverte,
      indisponibilites: [{ heureDebut: "10:00", heureFin: "11:00" }],
      reservationsExistantes: [],
      pasMinutes: 60,
    });
    expect(slots.find((s) => s.heure === "10:00")?.libre).toBe(false);
    expect(slots.find((s) => s.heure === "11:00")?.libre).toBe(true);
  });

  it("bloque un créneau qui chevauche une réservation existante", () => {
    const slots = calculerCreneaux({
      dureeMinutes: 60,
      battementMinutes: 0,
      dispoJour: dispoOuverte,
      indisponibilites: [],
      reservationsExistantes: [{ heureDebut: "10:30", heureFin: "11:30" }],
      pasMinutes: 30,
    });
    expect(slots.find((s) => s.heure === "10:00")?.libre).toBe(false);
    expect(slots.find((s) => s.heure === "10:30")?.libre).toBe(false);
    expect(slots.find((s) => s.heure === "11:00")?.libre).toBe(false);
    expect(slots.find((s) => s.heure === "11:30")?.libre).toBe(true);
  });

  it("le battement grignote le créneau juste après une réservation", () => {
    const slots = calculerCreneaux({
      dureeMinutes: 30,
      battementMinutes: 15,
      dispoJour: dispoOuverte,
      indisponibilites: [],
      reservationsExistantes: [{ heureDebut: "10:00", heureFin: "10:30" }],
      pasMinutes: 30,
    });
    // 10:30 tombe dans le battement (10:30 -> 10:45 occupé) : bloqué.
    expect(slots.find((s) => s.heure === "10:30")?.libre).toBe(false);
  });

  it("ne propose pas un créneau dont la durée déborde de la fermeture", () => {
    const slots = calculerCreneaux({
      dureeMinutes: 90,
      battementMinutes: 0,
      dispoJour: { ouvert: true, heureDebut: "10:00", heureFin: "12:00" },
      indisponibilites: [],
      reservationsExistantes: [],
      pasMinutes: 30,
    });
    // Dernier début possible : 10:30 (10:30+90min=12:00 pile).
    expect(slots.map((s) => s.heure)).toEqual(["10:00", "10:30"]);
  });
});
