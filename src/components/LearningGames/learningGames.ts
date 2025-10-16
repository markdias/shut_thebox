import { LearningGameId } from '../../types';

export interface LearningGameDefinition {
  id: LearningGameId;
  title: string;
  description: string;
}

export const LEARNING_GAMES: LearningGameDefinition[] = [
  {
    id: 'shapes',
    title: 'Shape explorer',
    description: 'Guess the corners and sides of colorful shapes.'
  },
  {
    id: 'dice',
    title: 'Dice dot detective',
    description: 'Predict the total before the dice reveal their pips.'
  },
  {
    id: 'dots',
    title: 'Secret dot flash',
    description: 'Count the glowing dots before the pattern changes.'
  },
  {
    id: 'math',
    title: 'Math mixer',
    description: 'Solve speedy addition, subtraction, times, or divide puzzles.'
  }
];
