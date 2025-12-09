import { Router } from "express";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import { authGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

/**
 * ------------------------------------------------
 * CREATE SECTION
 * POST /fam-sections
 * ------------------------------------------------
 */
router.post(
  "/",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const section = await FamiliarisationSectionTemplate.create(req.body);
      return res.status(201).json(section);
    } catch (err) {
      console.log("Create section error:", err);
      return res.status(500).json({ message: "Unable to create section" });
    }
  }
);

/**
 * ------------------------------------------------
 * LIST ALL SECTIONS
 * GET /fam-sections
 * ------------------------------------------------
 */
router.get("/", authGuard, async (req, res) => {
  try {
    const sections = await FamiliarisationSectionTemplate.findAll({
      order: [["order_number", "ASC"]],
    });
    return res.json(sections);
  } catch (err) {
    console.log("List sections error:", err);
    return res.status(500).json({ message: "Unable to fetch sections" });
  }
});

/**
 * ------------------------------------------------
 * GET ONE SECTION
 * GET /fam-sections/:id
 * ------------------------------------------------
 */
router.get("/:id", authGuard, async (req, res) => {
  try {
    const section = await FamiliarisationSectionTemplate.findByPk(
      req.params.id
    );

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    return res.json(section);
  } catch (err) {
    console.log("Get section error:", err);
    return res.status(500).json({ message: "Unable to fetch section" });
  }
});

/**
 * ------------------------------------------------
 * UPDATE SECTION
 * PUT /fam-sections/:id
 * ------------------------------------------------
 */
router.put(
  "/:id",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const section = await FamiliarisationSectionTemplate.findByPk(
        req.params.id
      );

      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      await section.update(req.body);

      return res.json({ message: "Section updated", section });
    } catch (err) {
      console.log("Update section error:", err);
      return res.status(500).json({ message: "Unable to update section" });
    }
  }
);

/**
 * ------------------------------------------------
 * DELETE SECTION
 * DELETE /fam-sections/:id
 * ------------------------------------------------
 */
router.delete(
  "/:id",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const section = await FamiliarisationSectionTemplate.findByPk(
        req.params.id
      );

      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      await section.destroy();

      return res.json({ message: "Section deleted" });
    } catch (err) {
      console.log("Delete section error:", err);
      return res.status(500).json({ message: "Unable to delete section" });
    }
  }
);

export default router;
