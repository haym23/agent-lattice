import { RouterProvider } from 'react-router-dom';

import { appRouter } from './router';

export function App(): JSX.Element {
  return <RouterProvider router={appRouter} />;
}
