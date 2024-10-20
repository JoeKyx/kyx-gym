export const mockWorkouts = [
  {
    name: 'Leg Workout',
    workout_items: [
      {
        name: 'Squat',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
        ],
      },
      {
        name: 'Leg Press',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
        ],
      },
      {
        name: 'Leg Extension',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
        ],
      },
    ],
  },
  {
    name: 'Chest Workout',
    workout_items: [
      {
        name: 'Bench Press',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 8, weight: 155 },
          { reps: 6, weight: 175 },
        ],
      },
      {
        name: 'Dumbbell Fly',
        sets: [
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 },
        ],
      },
      {
        name: 'Push Ups',
        sets: [
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 },
        ],
      },
    ],
  },
  {
    name: 'Back Workout',
    workout_items: [
      {
        name: 'Deadlift',
        sets: [
          { reps: 8, weight: 225 },
          { reps: 8, weight: 225 },
          { reps: 8, weight: 245 },
        ],
      },
      {
        name: 'Lat Pulldown',
        sets: [
          { reps: 12, weight: 80 },
          { reps: 12, weight: 90 },
          { reps: 10, weight: 100 },
        ],
      },
      {
        name: 'Bent Over Rows',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 10, weight: 145 },
          { reps: 10, weight: 155 },
        ],
      },
    ],
  },
  {
    name: 'Shoulder Workout',
    workout_items: [
      {
        name: 'Shoulder Press',
        sets: [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 65 },
          { reps: 8, weight: 70 },
        ],
      },
      {
        name: 'Lateral Raises',
        sets: [
          { reps: 12, weight: 20 },
          { reps: 12, weight: 20 },
          { reps: 12, weight: 25 },
        ],
      },
      {
        name: 'Front Raises',
        sets: [
          { reps: 12, weight: 20 },
          { reps: 12, weight: 20 },
          { reps: 12, weight: 25 },
        ],
      },
    ],
  },
  {
    name: 'Arm Workout',
    workout_items: [
      {
        name: 'Bicep Curls',
        sets: [
          { reps: 12, weight: 30 },
          { reps: 12, weight: 35 },
          { reps: 10, weight: 40 },
        ],
      },
      {
        name: 'Tricep Dips',
        sets: [
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 },
          { reps: 12, weight: 0 },
        ],
      },
      {
        name: 'Hammer Curls',
        sets: [
          { reps: 12, weight: 30 },
          { reps: 12, weight: 35 },
          { reps: 10, weight: 40 },
        ],
      },
    ],
  },
];

export const mockAiResponse =
  "<b>General Tips:</b> <br> <i>Rest Days:</i> Incorporate rest days, especially between similar muscle group workouts. <br> <i>Nutrition:</i> Don't neglect proper nutrition for recovery and growth. <br> <b>Leg Workout:</b> <br> <i>Progressive Overload:</i> Add weight or vary sets and reps. <br> <b>Chest Workout:</b> <br> <i>Bench Press:</i> Aim for 4 sets with higher weight and lower reps. <br> <b>Back Workout:</b> <br> <i>Deadlift:</i> Stick with a weight until mastering all sets. <br> <b>Shoulder Workout:</b> <br> <i>Lateral Raises:</i> Replace one set with higher weight. <br> <b>Arm Workout:</b> <br> <i>Tricep Dips:</i> Consider adding weight. <br> <i>Hammer Curls:</i> Add an extra set at 40 lbs.";
