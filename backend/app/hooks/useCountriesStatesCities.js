import { useState, useEffect, useCallback } from "react";

const API_KEY = "MHlWWnpWRG9WMWtNbnRBOVZvVmVGUWhyVXJ4em5JYlBKSTZleFk5MQ==";

export const useCountriesStatesCities = (selectedCountry, selectedState) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Fetch Countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          "https://restcountries.com/v2/all?fields=name,alpha2Code"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const sortedCountries = data
          .map((country) => ({
            name: country.name,
            code: country.alpha2Code,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(sortedCountries);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  // Fetch States
  const fetchStates = useCallback(async () => {
    if (!selectedCountry) {
      setStates([]);
      setCities([]);
      return;
    }

    try {
      const country = countries.find((c) => c.name === selectedCountry);
      if (!country) return;
      const response = await fetch(
        `https://api.countrystatecity.in/v1/countries/${country.code}/states`,
        { headers: { "X-CSCAPI-KEY": API_KEY } }
      );

      const data = await response.json();
      setStates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
    }
  }, [selectedCountry, countries]);

  // Fetch Cities
  const fetchCities = useCallback(async () => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    try {
      const country = countries.find((c) => c.name === selectedCountry);
      if (!country) return;

      const stateObj = states.find((state) => state.name === selectedState);
      if (!stateObj) return;

      const response = await fetch(
        `https://api.countrystatecity.in/v1/countries/${country.code}/states/${stateObj.iso2}/cities`,
        { headers: { "X-CSCAPI-KEY": API_KEY } }
      );

      const data = await response.json();
      setCities(Array.isArray(data) ? data.map((city) => city.name) : []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    }
  }, [selectedState, states, countries, selectedCountry]);

  return { countries, states, cities, fetchStates, fetchCities };
};
