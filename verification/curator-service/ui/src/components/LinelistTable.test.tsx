import '@testing-library/jest-dom/extend-expect';

import LinelistTable from './LinelistTable';
import React from 'react';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>;

it('loads and displays cases', async () => {
  const cases = [
    {
      _id: 'abc123',
      importedCase: {
        outcome: 'Recovered',
      },
      events: [
        {
          name: 'confirmed',
          date: {
            range: {
              start: new Date().toJSON(),
            },
          },
        }
      ],
    },
  ];
  const axiosResponse = {
    data: {
      cases: cases,
      total: 15,
      nextPage: 2,
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
  };
  mockedAxios.get.mockResolvedValueOnce(axiosResponse);

  const { findByText } = render(<LinelistTable />)

  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/');
  const items = await findByText(/abc123/);
  expect(items).toBeInTheDocument();
})