import {
  useLocation as ReactRouterDomUseLocation,
  useHistory,
  useParams,
} from 'react-router-dom';
import querystring from 'query-string';
import { useMemo } from 'react';

interface NavOptions {
  replace?: boolean;
}

export const useRouter = () => {
  const location = ReactRouterDomUseLocation();
  const history = useHistory();
  const params = useParams();

  const parsedLocation = useMemo(
    () => ({
      ...location,
      query: querystring.parse(location.search),
    }),
    [location],
  );

  const memorizedParams = useMemo(() => params, [params]);

  return [{
    location: parsedLocation,
    history,
    params: memorizedParams,
  }, {
    navWithQuery(query, options: NavOptions = {}) {
      history[options.replace ? 'replace' : 'push'](`${location.pathname}?${querystring.stringify(query)}`);
    },
  }];
};
