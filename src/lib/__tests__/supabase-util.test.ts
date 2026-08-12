const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@supabase/auth-helpers-nextjs', () => {
  const mockSupabaseClient = {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  };

  return {
    createClientComponentClient: () => mockSupabaseClient,
    mockSupabaseClient,
  };
});

jest.mock('@/lib/logger', () => jest.fn());

import { finishWorkoutInDB } from '@/lib/supabase-util';

const { mockSupabaseClient } = jest.requireMock(
  '@supabase/auth-helpers-nextjs',
) as {
  mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };
};

const mockGetUser = mockSupabaseClient.auth.getUser;
const mockFrom = mockSupabaseClient.from;

describe('finishWorkoutInDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq
      .mockReturnValueOnce({ eq: mockEq })
      .mockReturnValueOnce({ eq: mockEq })
      .mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it("only finishes the signed-in owner's active workout and returns it", async () => {
    const workout = {
      id: 42,
      status: 'finished',
      finished_at: '2026-08-12T10:00:00.000Z',
    };
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'owner-id' } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: workout, error: null });

    await expect(finishWorkoutInDB(42)).resolves.toEqual({
      success: true,
      data: workout,
    });

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'finished' });
    expect(mockEq).toHaveBeenNthCalledWith(1, 'id', 42);
    expect(mockEq).toHaveBeenNthCalledWith(2, 'userid', 'owner-id');
    expect(mockEq).toHaveBeenNthCalledWith(3, 'status', 'active');
  });

  it('does not issue an update without an authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(finishWorkoutInDB(42)).resolves.toEqual({
      success: false,
      error: 'You need to be signed in to finish a workout.',
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('treats an update affecting no workout as a failure', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'owner-id' } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(finishWorkoutInDB(42)).resolves.toEqual({
      success: false,
      error:
        'Workout was not active, could not be found, or you do not have permission to finish it.',
    });
  });
});
