import { base44 } from '@/api/base44Client';

/**
 * Computes the combined feature restrictions for a student:
 * school-wide restrictions + class restrictions + individual restrictions.
 *
 * @param {string} userEmail - The student's email
 * @returns {Promise<string[]>} Array of restricted feature keys
 */
export async function getStudentRestrictions(userEmail) {
  if (!userEmail) return [];
  try {
    const memberships = await base44.entities.SchoolMember.filter({ user_email: userEmail, kicked: false });
    const activeMembership = memberships.find(m => !m.dual_mode_enabled || m.currently_school_mode);
    if (!activeMembership) return [];

    const schools = await base44.entities.School.filter({ id: activeMembership.school_id });
    const school = schools[0];
    if (!school) return [];

    let restrictions = [...(school.restrictions || []), ...(activeMembership.individual_restrictions || [])];

    // Add class-level restrictions for classes the student belongs to
    const classes = await base44.entities.SchoolClass.filter({ school_id: school.id });
    const studentClasses = classes.filter(c => c.student_emails?.includes(userEmail));
    for (const cls of studentClasses) {
      restrictions.push(...(cls.restrictions || []));
    }

    return [...new Set(restrictions)];
  } catch (e) {
    return [];
  }
}