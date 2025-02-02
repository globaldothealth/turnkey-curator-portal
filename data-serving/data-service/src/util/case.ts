import { CaseDocument, CaseDTO } from '../model/day0-case';
import { CaseReferenceDocument } from '../model/case-reference';
import {
    demographicsAgeRange,
    DemographicsDocument,
} from '../model/demographics';
import { LocationDocument } from '../model/location';
import { PreexistingConditionsDocument } from '../model/preexisting-conditions';
import { TransmissionDocument } from '../model/transmission';
import { TravelHistoryDocument } from '../model/travel-history';
import { VaccineDocument } from '../model/vaccine';

import _ from 'lodash';
import { EventsDocument } from '../model/events';
import { GenomeSequenceDocument } from '../model/genome-sequence';

const validEvents = [
    'firstClinicalConsultation',
    'onsetSymptoms',
    'selfIsolation',
    'confirmed',
    'hospitalAdmission',
    'icuAdmission',
    'outcome',
];
const dateOnlyEvents = [
    'firstClinicalConsultation',
    'onsetSymptoms',
    'selfIsolation',
];

/**
 * Enum with possible sortBy keywords
 */
export enum SortBy {
    Default = 'default',
    ConfirmationDate = 'confirmationDate',
    Country = 'country',
    Admin3 = 'admin3',
    Location = 'location',
    Age = 'age',
    Occupation = 'occupation',
    Outcome = 'outcome',
    Identifier = '_id',
}

/**
 * Sorting order
 */
export enum SortByOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

/**
 * Returns correct keyword to sort by
 */
export const getSortByKeyword = (sortBy: SortBy): string => {
    let keyword: string;

    switch (sortBy) {
        case SortBy.ConfirmationDate:
            keyword = 'events.dateConfirmation';
            break;
        case SortBy.Country:
            keyword = 'location.countryISO3';
            break;
        case SortBy.Admin3:
            keyword = 'location.admin3';
            break;
        case SortBy.Location:
            keyword = 'location.location';
            break;
        default:
            keyword = 'events.dateConfirmation';
            break;
    }

    return keyword;
};

export const denormalizeEventsHeaders = (headers: string[]): string[] => {
    const index = headers.indexOf('events');
    if (index !== -1) {
        headers.splice(index, 1);
    }

    for (const name of validEvents) {
        headers.push(`events.${name}.date`);
        if (dateOnlyEvents.indexOf(name) === -1) {
            headers.push(`events.${name}.value`);
        }
    }

    return headers;
};

export const removeBlankHeader = (headers: string[]): string[] => {
    const index = headers.indexOf('');
    if (index !== -1) {
        headers.splice(index, 1);
    }
    return headers;
};

export const formatDateWithoutTime = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
};

export const denormalizeFields = async (
    doc: CaseDocument,
): Promise<Partial<CaseDocument>> => {
    const caseReferenceFields = denormalizeCaseReferenceFields(
        doc.caseReference,
    );
    const demographicsFields = await denormalizeDemographicsFields(
        doc.demographics,
    );
    const eventFields = denormalizeEventsFields(doc.events);
    const locationFields = denormalizeLocationFields(doc.location);
    const pathogenFields = denormalizePathogenField(doc.pathogen);
    const preexistingConditionsFields = denormalizePreexistingConditionsFields(
        doc.preexistingConditions,
    );
    const symptomsFields = denormalizeSymptomsFields(doc.symptoms);
    const transmissionFields = denormalizeTransmissionFields(doc.transmission);
    const travelHistoryFields = denormalizeTravelHistoryFields(
        doc.travelHistory,
    );
    const vaccineHistory = denormalizeVaccineFields(doc.vaccination);
    const genomeSequencesFields = denormalizeGenomeSequencesFields(
        doc.genomeSequences,
    );

    const nestedFields = [
        'caseReference',
        'demographics',
        'events',
        'location',
        'pathogen',
        'preexistingConditions',
        'symptoms',
        'transmission',
        'travelHistory',
        'vaccination',
        'genomeSequences',
    ];

    const undesiredFields = ['list', 'importedCase'];

    const flatFields = [
        caseReferenceFields,
        demographicsFields,
        eventFields,
        locationFields,
        pathogenFields,
        preexistingConditionsFields,
        symptomsFields,
        transmissionFields,
        travelHistoryFields,
        vaccineHistory,
        genomeSequencesFields,
    ];

    let denormalizedDocument = _.omit(doc, nestedFields);
    denormalizedDocument = _.omit(denormalizedDocument, undesiredFields);
    // add denormalized fields to object
    for (const fields of flatFields) {
        denormalizedDocument = Object.assign(denormalizedDocument, fields);
    }

    return denormalizedDocument;
};

function denormalizeCaseReferenceFields(
    doc: CaseReferenceDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};
    const additionalSources: string[] = [];
    if (doc.hasOwnProperty('additionalSources')) {
        for (const source of doc.additionalSources || []) {
            additionalSources.push(source.sourceUrl);
        }
    }
    denormalizedData['caseReference.additionalSources'] =
        additionalSources.join(',');
    denormalizedData['caseReference.sourceEntryId'] = doc.sourceEntryId || '';
    denormalizedData['caseReference.sourceId'] = doc.sourceId || '';
    denormalizedData['caseReference.sourceUrl'] = doc.sourceUrl || '';
    const uploadIds =
        doc.uploadIds === undefined ? '' : doc.uploadIds.join(',');
    denormalizedData['caseReference.uploadIds'] = '';
    denormalizedData['caseReference.uploadIds'] = uploadIds;
    return denormalizedData;
}

async function denormalizeDemographicsFields(
    doc: DemographicsDocument,
): Promise<Record<string, string | number>> {
    const denormalizedData: Record<string, string | number> = {};
    const ageRange = await demographicsAgeRange(doc);
    denormalizedData['demographics.ageRange.end'] = ageRange?.end || '';
    denormalizedData['demographics.ageRange.start'] = ageRange?.start || '';
    denormalizedData['demographics.gender'] = doc.gender || '';
    denormalizedData['demographics.occupation'] = doc.occupation || '';
    denormalizedData['demographics.healthcareWorker'] =
        doc.healthcareWorker || '';
    return denormalizedData;
}

export const denormalizeEventsFields = (
    doc: EventsDocument,
): Record<string, string> => {
    const denormalizedData: Record<string, string> = {};

    denormalizedData['events.dateEntry'] = doc.dateEntry
        ? formatDateWithoutTime(doc.dateEntry)
        : undefined || '';
    denormalizedData['events.dateReported'] = doc.dateReported
        ? formatDateWithoutTime(doc.dateReported)
        : undefined || '';
    denormalizedData['events.dateOnset'] = formatDateWithoutTime(doc.dateOnset);
    denormalizedData['events.dateConfirmation'] = formatDateWithoutTime(
        doc.dateConfirmation,
    );
    denormalizedData['events.confirmationMethod'] =
        doc.confirmationMethod || '';
    denormalizedData['events.dateOfFirstConsult'] = formatDateWithoutTime(
        doc.dateOfFirstConsult,
    );
    denormalizedData['events.hospitalized'] = doc.hospitalized || '';
    denormalizedData['events.reasonForHospitalization'] =
        doc.reasonForHospitalization || '';
    denormalizedData['events.dateHospitalization'] = formatDateWithoutTime(
        doc.dateHospitalization,
    );
    denormalizedData['events.dateDischargeHospital'] = formatDateWithoutTime(
        doc.dateDischargeHospital,
    );
    denormalizedData['events.intensiveCare'] = doc.intensiveCare || '';
    denormalizedData['events.dateAdmissionICU'] = formatDateWithoutTime(
        doc.dateAdmissionICU,
    );
    denormalizedData['events.dateDischargeICU'] = formatDateWithoutTime(
        doc.dateDischargeICU,
    );
    denormalizedData['events.homeMonitoring'] = doc.homeMonitoring || '';
    denormalizedData['events.isolated'] = doc.isolated || '';
    denormalizedData['events.dateIsolation'] = formatDateWithoutTime(
        doc.dateIsolation,
    );
    denormalizedData['events.outcome'] = doc.outcome || '';
    denormalizedData['events.dateDeath'] = formatDateWithoutTime(doc.dateDeath);
    denormalizedData['events.dateRecovered'] = formatDateWithoutTime(
        doc.dateRecovered,
    );

    return denormalizedData;
};

function denormalizeLocationFields(
    doc: LocationDocument,
): Record<string, string | number> {
    const denormalizedData: Record<string, string | number> = {};

    denormalizedData['location.country'] = doc.country || '';
    denormalizedData['location.countryISO3'] = doc.countryISO3 || '';
    denormalizedData['location.location'] = doc.location || '';
    denormalizedData['location.admin1'] = doc.admin1 || '';
    denormalizedData['location.admin2'] = doc.admin2 || '';
    denormalizedData['location.admin3'] = doc.admin3 || '';
    denormalizedData['location.geoResolution'] = doc.geoResolution || '';
    denormalizedData['location.geometry.latitude'] =
        doc.geometry?.latitude || '';
    denormalizedData['location.geometry.longitude'] =
        doc.geometry?.longitude || '';
    denormalizedData['location.query'] = doc.query || '';

    return denormalizedData;
}

function denormalizeGenomeSequencesFields(
    doc: GenomeSequenceDocument,
): Record<string, string | number> {
    const denormalizedData: Record<string, string | number> = {};

    denormalizedData['genomeSequences.genomicsMetadata'] =
        doc.genomicsMetadata || '';
    denormalizedData['genomeSequences.accessionNumber'] =
        doc.accessionNumber || '';
    return denormalizedData;
}

function denormalizePathogenField(pathogen: string): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    denormalizedData['pathogen'] = pathogen || '';

    return denormalizedData;
}

function denormalizePreexistingConditionsFields(
    doc: PreexistingConditionsDocument,
): Record<string, string | boolean> {
    const denormalizedData: Record<string, string | boolean> = {};

    denormalizedData['preexistingConditions.previousInfection'] =
        doc?.previousInfection || '';
    denormalizedData['preexistingConditions.coInfection'] =
        doc?.coInfection || '';
    denormalizedData['preexistingConditions.pregnancyStatus'] =
        doc?.pregnancyStatus || '';
    denormalizedData['preexistingConditions.preexistingCondition'] =
        doc?.preexistingCondition || '';
    return denormalizedData;
}

function denormalizeSymptomsFields(symptoms: string): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    denormalizedData['symptoms'] = symptoms || '';
    return denormalizedData;
}

function denormalizeTransmissionFields(
    doc: TransmissionDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    denormalizedData['transmission.contactWithCase'] =
        doc?.contactWithCase || '';
    denormalizedData['transmission.contactId'] = doc?.contactId || '';
    denormalizedData['transmission.contactSetting'] = doc?.contactSetting || '';
    denormalizedData['transmission.contactAnimal'] = doc?.contactAnimal || '';
    denormalizedData['transmission.contactComment'] = doc?.contactComment || '';
    denormalizedData['transmission.transmission'] = doc?.transmission || '';

    return denormalizedData;
}

function denormalizeTravelHistoryFields(
    doc: TravelHistoryDocument,
): Record<string, string | boolean> {
    const denormalizedData: Record<string, string | boolean> = {};

    denormalizedData['travelHistory.travelHistory'] = doc?.travelHistory || '';
    denormalizedData['travelHistory.travelHistoryEntry'] =
        formatDateWithoutTime(doc?.travelHistoryEntry);
    denormalizedData['travelHistory.travelHistoryStart'] =
        doc?.travelHistoryStart || '';
    denormalizedData['travelHistory.travelHistoryLocation'] =
        doc?.travelHistoryLocation || '';
    denormalizedData['travelHistory.travelHistoryCountry'] =
        doc?.travelHistoryCountry || '';

    return denormalizedData;
}

function denormalizeVaccineFields(
    doc: VaccineDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    denormalizedData['vaccination.vaccination'] = doc?.vaccination || '';
    denormalizedData['vaccination.vaccineName'] = doc?.vaccineName || '';
    denormalizedData['vaccination.vaccineDate'] = formatDateWithoutTime(
        doc?.vaccineDate,
    );
    denormalizedData['vaccination.vaccineSideEffects'] =
        doc?.vaccineSideEffects || '';

    return denormalizedData;
}
