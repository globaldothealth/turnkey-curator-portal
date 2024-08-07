import '@testing-library/jest-dom/extend-expect';

import { screen, fireEvent, render, waitFor } from './util/test-utils';

import React from 'react';
import SourceTable from './SourceTable';
import axios from 'axios';
import { vi } from 'vitest';

beforeAll(() => {
    vi.mock('axios');
});

afterAll(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    axios.get.mockClear();
    axios.delete.mockClear();
    axios.post.mockClear();
    axios.put.mockClear();
});

describe('<SourceTable />', () => {
    it('loads and displays sources', async () => {
        const sourceId = 'abc123';
        const sourceName = 'source_name';
        const originUrl = 'origin url';
        const format = 'JSON';
        const providerName = 'provider_name';
        const providerWebsiteUrl = 'website url';
        const countryCodes = ['US', 'MX', 'CA'];
        const license = 'MIT';
        const recipients = ['foo@bar.com', 'bar@baz.com'];
        const sources = [
            {
                _id: sourceId,
                name: sourceName,
                format: format,
                countryCodes: countryCodes,
                origin: {
                    url: originUrl,
                    license,
                    providerName,
                    providerWebsiteUrl,
                },
                dateFilter: {
                    numDaysBeforeToday: 666,
                    op: 'EQ',
                },
                notificationRecipients: recipients,
            },
        ];
        const axiosResponse = {
            data: {
                sources: sources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosResponse);
        render(<SourceTable />);

        // Verify backend calls.
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');

        // Verify display content.
        expect(
            await screen.findByText(new RegExp(sourceId)),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(sourceName)),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(countryCodes.join(','))),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(originUrl)),
        ).toBeInTheDocument();
        expect(await screen.findByText(new RegExp(format))).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(license)),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(providerName)),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(providerWebsiteUrl)),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(new RegExp(recipients.join('.*'))),
        ).toBeInTheDocument();
        expect(
            await screen.findByText('Only parse data from 666 day(s) ago'),
        ).toBeInTheDocument();
    });

    it('API errors are displayed', async () => {
        // TODO: Write/load json files for this/LLT test.
        const sources = [
            {
                _id: 'abc123',
                name: 'source_name',
                countryCodes: ['US', 'CA', 'MX'],
                format: 'JSON',
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
            },
        ];
        const axiosResponse = {
            data: {
                sources: sources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosResponse);
        render(<SourceTable />);

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
        const row = await screen.findByText(/abc123/);
        expect(row).toBeInTheDocument();

        // Throw error on delete request.
        axios.delete.mockRejectedValueOnce(new Error('Request failed'));

        const deleteButton = screen.getByTestId(/delete_outline/);
        fireEvent.click(deleteButton);
        const confirmButton = screen.getByTestId(/check/);
        fireEvent.click(confirmButton);
        expect(axios.delete).toHaveBeenCalledTimes(1);

        const error = await screen.findByText('Error: Request failed');
        expect(error).toBeInTheDocument();
    });

    it('can delete a row', async () => {
        const sources = [
            {
                _id: 'abc123',
                name: 'source_name',
                countryCodes: ['US', 'CA', 'MX'],
                format: 'JSON',
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
            },
        ];
        const axiosResponse = {
            data: {
                sources: sources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosResponse);

        // Load table
        render(<SourceTable />);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
        const row = await screen.findByText(/abc123/);
        expect(row).toBeInTheDocument();

        // Delete source
        const axiosGetAfterDeleteResponse = {
            data: {
                sources: [],
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosDeleteResponse = {
            data: {
                source: sources[0],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosGetAfterDeleteResponse);
        axios.delete.mockResolvedValueOnce(axiosDeleteResponse);

        const deleteButton = screen.getByTestId(/delete_outline/);
        fireEvent.click(deleteButton);
        const confirmButton = screen.getByTestId(/check/);
        fireEvent.click(confirmButton);
        expect(axios.delete).toHaveBeenCalledTimes(1);
        expect(axios.delete).toHaveBeenCalledWith(
            '/api/sources/' + sources[0]._id,
        );

        // Check table data is reloaded
        expect(axios.get).toHaveBeenCalledTimes(1);
        const noRec = await screen.findByText(/No records to display/);
        expect(noRec).toBeInTheDocument();
    });

    it('can edit a row', async () => {
        const sources = [
            {
                _id: 'abc123',
                name: 'source_name',
                countryCodes: ['US', 'CA', 'MX'],
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
            },
        ];
        const axiosResponse = {
            data: {
                sources: sources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosResponse);

        // Load table
        render(<SourceTable />);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
        const row = await screen.findByText('origin url');
        expect(row).toBeInTheDocument();

        // Edit sources
        const editedSources = [
            {
                _id: 'abc123',
                name: 'source_name',
                countryCodes: ['US', 'CA', 'MX'],
                format: 'format',
                origin: {
                    url: 'new source url',
                    license: 'origin license',
                },
            },
        ];
        const axiosGetAfterEditResponse = {
            data: {
                sources: editedSources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosEditResponse = {
            data: {
                source: editedSources[0],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.put.mockResolvedValueOnce(axiosEditResponse);
        axios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

        const editButton = screen.getByTestId(/edit/);
        fireEvent.click(editButton);
        const confirmButton = screen.getByTestId(/check/);
        fireEvent.click(confirmButton);
        expect(axios.put).toHaveBeenCalledTimes(1);

        // Check table data is reloaded
        expect(axios.get).toHaveBeenCalledTimes(1);
        const editedRow = await screen.findByText('new source url');
        expect(editedRow).toBeInTheDocument();
        const oldRow = screen.queryByText('origin url');
        expect(oldRow).not.toBeInTheDocument();
    });

    it('can edit the boolean fields in a row', async () => {
        const sources = [
            {
                _id: 'abc123',
                name: 'source_name',
                countryCodes: ['US', 'CA', 'MX'],
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
                excludeFromLineList: false,
                hasStableIdentifiers: false,
            },
        ];
        const axiosResponse = {
            data: {
                sources: sources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosResponse);

        // Load table
        render(<SourceTable />);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
        const row = await screen.findByText('origin url');
        expect(row).toBeInTheDocument();

        // Edit sources
        const editedSources = [
            {
                _id: 'abc123',
                name: 'source_name',
                countryCodes: ['US', 'CA', 'MX'],
                format: 'format',
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
                excludeFromLineList: true,
                hasStableIdentifiers: true,
            },
        ];
        const axiosGetAfterEditResponse = {
            data: {
                sources: editedSources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosEditResponse = {
            data: {
                source: editedSources[0],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.put.mockResolvedValueOnce(axiosEditResponse);
        axios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

        const editButton = screen.getByTestId(/edit/);
        fireEvent.click(editButton);
        const confirmButton = screen.getByTestId(/check/);
        fireEvent.click(confirmButton);
        expect(axios.put).toHaveBeenCalledTimes(1);

        // Check table data is reloaded
        expect(axios.get).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            const editedRow = screen.getByText('origin url');
            expect(editedRow).toBeInTheDocument();
        });
    });

    it('can edit a row even if sending notifications on edit fails', async () => {
        const sources = [
            {
                _id: 'abc123',
                name: 'old_source_name',
                countryCodes: ['US', 'CA', 'MX'],
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
            },
        ];
        const axiosResponse = {
            data: {
                sources: sources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.get.mockResolvedValueOnce(axiosResponse);

        // Load table
        render(<SourceTable />);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/sources/?limit=10&page=1');
        const row = await screen.findByText('origin url');
        expect(row).toBeInTheDocument();

        // Edit sources
        const editedSources = [
            {
                _id: 'abc123',
                name: 'new_source_name',
                countryCodes: ['US', 'CA', 'MX'],
                format: 'format',
                origin: {
                    url: 'origin url',
                    license: 'origin license',
                },
            },
        ];
        const axiosGetAfterEditResponse = {
            data: {
                sources: editedSources,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosEditResponse = {
            data: {
                source: editedSources[0],
                name: 'NotificationSendError',
            },
            status: 500,
            statusText: 'error',
            config: {},
            headers: {},
        };
        axios.put.mockResolvedValueOnce(axiosEditResponse);
        axios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

        const editButton = screen.getByTestId(/edit/);
        fireEvent.click(editButton);
        const confirmButton = screen.getByTestId(/check/);
        fireEvent.click(confirmButton);
        expect(axios.put).toHaveBeenCalledTimes(1);

        // Check table data is reloaded
        expect(axios.get).toHaveBeenCalledTimes(1);
        const editedRow = await screen.findByText('new_source_name');
        expect(editedRow).toBeInTheDocument();
        const oldRow = screen.queryByText('old_source_name');
        expect(oldRow).not.toBeInTheDocument();
    });
});
