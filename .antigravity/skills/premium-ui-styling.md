### Skill: Premium Glassmorphic UI Styling
**Trigger:** *"Create a premium component for [X]"* or *"Style this for the Shepherd Dashboard."*

**Steps:**
1.  **Backdrop**: Apply a semi-transparent background using `bg-white/10` (light) or `bg-slate-900/40` (dark) with `backdrop-blur-xl`.
2.  **Bordering**: Add thin, high-contrast borders using `border border-white/20`.
3.  **Elevation**: Use subtle box shadows (`shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]`) to create depth.
4.  **Transitions**: Wrap interactive elements in `framer-motion` `<motion.div>` with `whileHover={{ scale: 1.02 }}` and `initial={{ opacity: 0 }}`.
5.  **Typography**: Ensure high-density tracking and use `font-medium` for headers with vibrant, modern colors (Inter/Outfit).

**Success Criteria:** 
- The component feels "premium" and integrated with the Japan Kingdom Church's "high-end" design language.
- Micro-animations feel smooth and responsive.

**Failure Handling:** 
- If the design looks "flat," increase the backdrop blur intensity and add a high-contrast accent border.
- If accessibility is a concern (limited contrast), use a slightly more opaque background while retaining the blur.
