# Development Guardrails - AI Assistant Contract

**This is a binding contract for AI assistants working on JSONLens. These rules are NON-NEGOTIABLE and must be followed 100% of the time.**

---

## ABSOLUTE PROHIBITIONS

### **1. NO EMOJIS - EVER**
- **NEVER** use emojis in code files
- **NEVER** use emojis in comments
- **NEVER** use emojis in JSDoc
- **NEVER** use emojis in tests
- **NEVER** use emojis in commit messages
- **NEVER** use emojis in file headers
- **NEVER** use emojis in documentation
- **NEVER** use emojis in README files
- **NEVER** use emojis in any source code

**ONLY EXCEPTION:** UI copy may contain emojis ONLY if explicitly requested by the user.

### **2. NO TAGS OR MENTIONS - EVER**
- **NEVER** add Git tags
- **NEVER** @mention people
- **NEVER** reference issues with #123
- **NEVER** include AI model names (Claude, Cursor, ChatGPT, etc.)
- **NEVER** add co-author lines
- **NEVER** reference external services

### **3. NO PHASE SKIPPING - EVER**
- **NEVER** skip any phase without 100% completion
- **NEVER** move to next phase with incomplete work
- **NEVER** leave features half-finished
- **NEVER** skip testing or validation
- **NEVER** skip documentation

---

## MANDATORY REQUIREMENTS

### **1. PHASE COMPLETION PROTOCOL**
- **ALWAYS** complete each phase 100% before moving on
- **ALWAYS** run lint/tests and verify acceptance criteria
- **ALWAYS** test all features thoroughly
- **ALWAYS** document all changes
- **ALWAYS** ensure code quality standards

### **2. COMMIT & PUSH PROTOCOL**
- **ALWAYS** commit after every phase completion
- **ALWAYS** use format: `phase<N>: <short summary>`
- **ALWAYS** push immediately after commit
- **ALWAYS** ensure clean, professional commit messages
- **ALWAYS** verify build passes before pushing

### **3. CODE QUALITY STANDARDS**
- **ALWAYS** maintain 90%+ test coverage
- **ALWAYS** follow TypeScript best practices
- **ALWAYS** use proper error handling
- **ALWAYS** add comprehensive documentation
- **ALWAYS** ensure accessibility compliance

---

## PHASE COMPLETION CHECKLIST

**Before moving to any new phase, I MUST:**

1. **Code Quality**
   - [ ] All code compiles without errors
   - [ ] All tests pass
   - [ ] Linting passes with no warnings
   - [ ] TypeScript types are correct
   - [ ] No console errors or warnings

2. **Feature Completeness**
   - [ ] All planned features are implemented
   - [ ] All features are tested
   - [ ] All features are documented
   - [ ] All features work as expected
   - [ ] All edge cases are handled

3. **Documentation**
   - [ ] Code is properly commented
   - [ ] README is updated if needed
   - [ ] API documentation is current
   - [ ] User-facing changes are documented
   - [ ] Technical decisions are recorded

4. **Testing**
   - [ ] Unit tests written and passing
   - [ ] Integration tests written and passing
   - [ ] Manual testing completed
   - [ ] Edge cases tested
   - [ ] Error scenarios tested

5. **Performance**
   - [ ] No performance regressions
   - [ ] Memory usage is reasonable
   - [ ] Load times are acceptable
   - [ ] Animations are smooth
   - [ ] Large datasets handled properly

6. **Accessibility**
   - [ ] Screen reader compatibility
   - [ ] Keyboard navigation works
   - [ ] Color contrast is adequate
   - [ ] Focus management is correct
   - [ ] ARIA labels are present

---

## COMMIT MESSAGE FORMAT

**MANDATORY FORMAT:**
```
phase<N>: <short summary>
```

**EXAMPLES:**
- `phase1: add universal data engine and multi-format support`
- `phase2: implement dynamic editor system with tabbed workspace`
- `phase3: add visualization engine with chart library`

**FORBIDDEN:**
- `feat: add new feature`
- `fix: bug fix`
- `chore: update dependencies`
- `docs: update readme`
- Any emojis, tags, or mentions

---

## VIOLATION CONSEQUENCES

**If I violate any of these rules:**
1. **IMMEDIATELY** stop all work
2. **IMMEDIATELY** revert any changes that violate rules
3. **IMMEDIATELY** fix the violation
4. **IMMEDIATELY** re-commit with correct format
5. **IMMEDIATELY** re-push the corrected commit

**NO EXCEPTIONS. NO EXCUSES. NO NEGOTIATION.**

---

## DAILY REMINDER

**Before starting any work session, I must read this file and confirm:**
- [ ] I will not use emojis anywhere
- [ ] I will not skip any phase without 100% completion
- [ ] I will not add tags, mentions, or co-authors
- [ ] I will commit and push after every phase completion
- [ ] I will follow the exact commit message format
- [ ] I will maintain all quality standards

**This is my personal contract. I will follow it religiously.**

---

## SUCCESS METRICS

**I will measure my success by:**
- **0** emoji violations
- **0** phase skips
- **0** tag/mention violations
- **100%** phase completion rate
- **100%** commit/push compliance
- **90%+** test coverage maintained
- **100%** accessibility compliance

**These are non-negotiable targets.**

---

*This document is binding and must be followed 100% of the time. No exceptions.*