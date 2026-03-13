import { Board } from './types';

export const dummyBoard: Board = {
  columns: [
    { id: 'col-1', title: 'To Do', cardIds: ['card-1', 'card-2', 'card-3'] },
    {
      id: 'col-2',
      title: 'In Progress',
      cardIds: ['card-4', 'card-5'],
    },
    {
      id: 'col-3',
      title: 'Review',
      cardIds: ['card-6', 'card-7'],
    },
    {
      id: 'col-4',
      title: 'Testing',
      cardIds: ['card-8'],
    },
    {
      id: 'col-5',
      title: 'Done',
      cardIds: ['card-9', 'card-10', 'card-11'],
    },
  ],
  cards: {
    'card-1': {
      id: 'card-1',
      title: 'Design homepage layout',
      details: 'Create mockups and wireframes for the new landing page',
    },
    'card-2': {
      id: 'card-2',
      title: 'Fix navigation menu',
      details: 'Mobile navigation dropdown is not working properly',
    },
    'card-3': {
      id: 'card-3',
      title: 'Update API documentation',
      details: 'Document new endpoints and update authentication guide',
    },
    'card-4': {
      id: 'card-4',
      title: 'Implement user auth',
      details: 'Add JWT-based authentication with refresh tokens',
    },
    'card-5': {
      id: 'card-5',
      title: 'Database schema refactor',
      details: 'Normalize tables and optimize indexes for performance',
    },
    'card-6': {
      id: 'card-6',
      title: 'Code review team updates',
      details: 'Review pull requests for the core module changes',
    },
    'card-7': {
      id: 'card-7',
      title: 'Performance testing',
      details: 'Run load tests and identify bottlenecks in API',
    },
    'card-8': {
      id: 'card-8',
      title: 'QA final checklist',
      details: 'Run all test cases and verify edge cases are covered',
    },
    'card-9': {
      id: 'card-9',
      title: 'Deploy to production',
      details: 'Release v2.1 with all bug fixes and features',
    },
    'card-10': {
      id: 'card-10',
      title: 'Update release notes',
      details: 'Document all changes and improvements in this release',
    },
    'card-11': {
      id: 'card-11',
      title: 'Monitor performance',
      details: 'Set up alerts and dashboards for production metrics',
    },
  },
};
