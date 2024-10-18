import { getCountries } from '$lib/api';

export const load = async () => {
	const countries = await getCountries();

  console.log(countries)

	return {
		countries: countries ?? []
	};
};
