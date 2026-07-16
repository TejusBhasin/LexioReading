import { base44 } from '@/api/base44Client';

/**
 * Checks if the current user belongs to a school with content isolation enabled.
 * If so, returns the set of member emails that content should be filtered to.
 *
 * @param {string} userEmail - The authenticated user's email
 * @returns {Promise<{schoolName: string, memberEmails: string[]} | null>}
 *   Returns filter info if isolation applies, null otherwise.
 */
export async function getIsolationFilter(userEmail) {
  if (!userEmail) return null;
  try {
    const memberships = await base44.entities.SchoolMember.filter({
      user_email: userEmail,
      kicked: false,
    });
    if (!memberships.length) return null;

    for (const m of memberships) {
      // Skip dual-mode users currently in personal mode
      if (m.dual_mode_enabled && !m.currently_school_mode) continue;

      const schools = await base44.entities.School.filter({ id: m.school_id });
      const school = schools[0];
      if (!school?.content_isolation) continue;

      const members = await base44.entities.SchoolMember.filter({
        school_id: school.id,
        kicked: false,
      });
      return {
        schoolName: school.name,
        memberEmails: members.map(mem => mem.user_email),
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}