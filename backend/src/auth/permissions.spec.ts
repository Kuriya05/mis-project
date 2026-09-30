import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('Helpdesk permission model (authorization.md ข้อ 4)', () => {
  describe('STUDENT', () => {
    const role = SubsystemRole.STUDENT;

    it('asks, answers, votes and manages its own posts', () => {
      expect(can(role, Permission.QUESTION_CREATE)).toBe(true);
      expect(can(role, Permission.COMMENT_CREATE)).toBe(true);
      expect(can(role, Permission.QUESTION_VOTE)).toBe(true);
      expect(can(role, Permission.QUESTION_UPDATE_OWN)).toBe(true);
      expect(can(role, Permission.COMMENT_VERIFY_OWN)).toBe(true);
    });

    it('cannot touch other people posts or verify answers on other questions', () => {
      expect(can(role, Permission.QUESTION_UPDATE_ANY)).toBe(false);
      expect(can(role, Permission.QUESTION_DELETE_ANY)).toBe(false);
      expect(can(role, Permission.COMMENT_DELETE_ANY)).toBe(false);
      expect(can(role, Permission.COMMENT_VERIFY_ANY)).toBe(false);
      expect(can(role, Permission.SAMPLE_DATA_LOAD)).toBe(false);
    });
  });

  describe('ALUMNI', () => {
    it('is read-only', () => {
      const role = SubsystemRole.ALUMNI;
      expect(can(role, Permission.QUESTION_READ)).toBe(true);
      expect(can(role, Permission.TAG_READ)).toBe(true);
      expect(can(role, Permission.QUESTION_CREATE)).toBe(false);
      expect(can(role, Permission.COMMENT_CREATE)).toBe(false);
      expect(can(role, Permission.QUESTION_VOTE)).toBe(false);
    });
  });

  describe('STAFF', () => {
    const role = SubsystemRole.STAFF;

    it('can verify an answer on any question', () => {
      expect(can(role, Permission.COMMENT_VERIFY_ANY)).toBe(true);
    });

    it('cannot moderate other people posts - that stays with ADMIN', () => {
      expect(can(role, Permission.QUESTION_DELETE_ANY)).toBe(false);
      expect(can(role, Permission.COMMENT_UPDATE_ANY)).toBe(false);
      expect(can(role, Permission.SAMPLE_DATA_LOAD)).toBe(false);
    });
  });

  describe('ADMIN', () => {
    it('holds every permission', () => {
      for (const permission of Object.values(Permission)) {
        expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
      }
    });
  });

  it('canAny passes when at least one permission matches', () => {
    expect(
      canAny(SubsystemRole.STUDENT, [Permission.QUESTION_DELETE_ANY, Permission.QUESTION_DELETE_OWN]),
    ).toBe(true);
    expect(
      canAny(SubsystemRole.ALUMNI, [Permission.QUESTION_CREATE, Permission.COMMENT_CREATE]),
    ).toBe(false);
  });

  it('defines permissions for every subsystem role', () => {
    for (const role of Object.values(SubsystemRole)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});
