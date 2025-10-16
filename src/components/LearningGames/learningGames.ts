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
  }
];
