import ErrorPage from './error-page';

export default function NotFound() {
  return <ErrorPage error={{ status: 404 }} />;
}
