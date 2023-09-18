// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Unable to block-ignore errors ('Property does not exist' in this file)
// https://github.com/Microsoft/TypeScript/issues/19573

import { AgeBucket } from '../../src/model/age-bucket';
import { CaseDocument } from '../model/case';
import { CaseReferenceDocument } from '../model/case-reference';
import { DemographicsDocument } from '../model/demographics';
import { EventDocument } from '../model/event';
import { LocationDocument } from '../model/location';
import { PreexistingConditionsDocument } from '../model/preexisting-conditions';
import { RevisionMetadataDocument } from '../model/revision-metadata';
import { TransmissionDocument } from '../model/transmission';
import { TravelHistoryDocument } from '../model/travel-history';
import { VaccineDocument } from '../model/vaccine';
import { removeBlankHeader, denormalizeFields } from '../../src/util/case';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GenomeSequenceDocument } from '../../src/model/genome-sequence';
import { EventsDocument } from '../../src/model/events';

let mongoServer: MongoMemoryServer;

async function createAgeBuckets() {
    await new AgeBucket({
        start: 0,
        end: 0,
    }).save();
    for (let start = 1; start <= 116; start += 5) {
        const end = start + 4;
        await new AgeBucket({
            start,
            end,
        }).save();
    }
}

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoURL = process.env.MONGO_URL;
    await mongoose.connect(mongoURL);
    await createAgeBuckets();
});

afterAll(async () => {
    await AgeBucket.deleteMany({});
    await mongoose.disconnect();
    return mongoServer.stop();
});

describe('Case', () => {
    it('removes the blank header', () => {
        let headers = [
            '_id',
            'caseReference.additionalSources',
            'caseReference.sourceEntryId',
            'caseReference.sourceId',
            'caseReference.sourceUrl',
            'caseReference.uploadIds',
            'caseReference.verificationStatus',
            'demographics.ageRange.end',
            'demographics.ageRange.start',
            'demographics.ethnicity',
            'demographics.gender',
            'demographics.nationalities',
            'demographics.occupation',
            'events.confirmed.date',
            'events.firstClinicalConsultation.date',
            'events.onsetSymptoms.date',
            'events.selfIsolation.date',
            'events.hospitalAdmission.date',
            'events.icuAdmission.date',
            'events.outcome.date',
            'events.firstClinicalConsultation.value',
            'events.onsetSymptoms.value',
            'events.selfIsolation.value',
            'genomeSequences',
            'location.administrativeAreaLevel1',
            'location.administrativeAreaLevel2',
            'location.administrativeAreaLevel3',
            'location.country',
            'location.geoResolution',
            'location.geometry.latitude',
            'location.geometry.longitude',
            'location.name',
            'location.place',
            'location.query',
            'pathogens',
            'preexistingConditions.hasPreexistingConditions',
            'preexistingConditions.values',
            'revisionMetadata.creationMetadata.curator',
            'revisionMetadata.creationMetadata.date',
            'revisionMetadata.creationMetadata.notes',
            'revisionMetadata.editMetadata.curator',
            'revisionMetadata.editMetadata.date',
            'revisionMetadata.editMetadata.notes',
            'revisionMetadata.revisionNumber',
            'SGTF',
            'symptoms.status',
            'symptoms.values',
            'transmission.linkedCaseIds',
            'transmission.places',
            'transmission.routes',
            'travelHistory.travel.dateRange.end',
            'travelHistory.travel.dateRange.start',
            'travelHistory.travel.location.name',
            'travelHistory.travel.methods',
            'travelHistory.travel.purpose',
            'travelHistory.traveledPrior30Days',
            'vaccines.0.name',
            'vaccines.0.batch',
            'vaccines.0.date',
            'vaccines.0.sideEffects',
            'vaccines.1.name',
            'vaccines.1.batch',
            'vaccines.1.date',
            'vaccines.1.sideEffects',
            'vaccines.2.name',
            'vaccines.2.batch',
            'vaccines.2.date',
            'vaccines.2.sideEffects',
            'vaccines.3.name',
            'vaccines.3.batch',
            'vaccines.3.date',
            'vaccines.3.sideEffects',
            '',
        ];
        headers = removeBlankHeader(headers);
        expect(headers).toEqual([
            '_id',
            'caseReference.additionalSources',
            'caseReference.sourceEntryId',
            'caseReference.sourceId',
            'caseReference.sourceUrl',
            'caseReference.uploadIds',
            'caseReference.verificationStatus',
            'demographics.ageRange.end',
            'demographics.ageRange.start',
            'demographics.ethnicity',
            'demographics.gender',
            'demographics.nationalities',
            'demographics.occupation',
            'events.confirmed.date',
            'events.firstClinicalConsultation.date',
            'events.onsetSymptoms.date',
            'events.selfIsolation.date',
            'events.hospitalAdmission.date',
            'events.icuAdmission.date',
            'events.outcome.date',
            'events.firstClinicalConsultation.value',
            'events.onsetSymptoms.value',
            'events.selfIsolation.value',
            'genomeSequences',
            'location.administrativeAreaLevel1',
            'location.administrativeAreaLevel2',
            'location.administrativeAreaLevel3',
            'location.country',
            'location.geoResolution',
            'location.geometry.latitude',
            'location.geometry.longitude',
            'location.name',
            'location.place',
            'location.query',
            'pathogens',
            'preexistingConditions.hasPreexistingConditions',
            'preexistingConditions.values',
            'revisionMetadata.creationMetadata.curator',
            'revisionMetadata.creationMetadata.date',
            'revisionMetadata.creationMetadata.notes',
            'revisionMetadata.editMetadata.curator',
            'revisionMetadata.editMetadata.date',
            'revisionMetadata.editMetadata.notes',
            'revisionMetadata.revisionNumber',
            'SGTF',
            'symptoms.status',
            'symptoms.values',
            'transmission.linkedCaseIds',
            'transmission.places',
            'transmission.routes',
            'travelHistory.travel.dateRange.end',
            'travelHistory.travel.dateRange.start',
            'travelHistory.travel.location.name',
            'travelHistory.travel.methods',
            'travelHistory.travel.purpose',
            'travelHistory.traveledPrior30Days',
            'vaccines.0.name',
            'vaccines.0.batch',
            'vaccines.0.date',
            'vaccines.0.sideEffects',
            'vaccines.1.name',
            'vaccines.1.batch',
            'vaccines.1.date',
            'vaccines.1.sideEffects',
            'vaccines.2.name',
            'vaccines.2.batch',
            'vaccines.2.date',
            'vaccines.2.sideEffects',
            'vaccines.3.name',
            'vaccines.3.batch',
            'vaccines.3.date',
            'vaccines.3.sideEffects',
        ]);
    });
    it('handles any undefined fields', async () => {
        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            symptoms: '',
            caseStatus: '',
            preexistingConditions: {} as PreexistingConditionsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['caseReference.sourceId']).toEqual('');
        expect(denormalizedCase['caseReference.sourceEntryId']).toEqual('');
        expect(denormalizedCase['caseReference.sourceUrl']).toEqual('');
        expect(denormalizedCase['caseReference.uploadIds']).toEqual('');
        expect(denormalizedCase['caseReference.additionalSources']).toEqual('');

        expect(denormalizedCase['demographics.ageRange.end']).toEqual('');
        expect(denormalizedCase['demographics.ageRange.start']).toEqual('');
        expect(denormalizedCase['demographics.gender']).toEqual('');
        expect(denormalizedCase['demographics.occupation']).toEqual('');

        expect(denormalizedCase['events.dateEntry']).toEqual('');
        expect(denormalizedCase['events.dateOnset']).toEqual('');
        expect(denormalizedCase['events.dateConfirmation']).toEqual('');
        expect(denormalizedCase['events.confirmationMethod']).toEqual('');
        expect(denormalizedCase['events.dateOfFirstConsult']).toEqual('');
        expect(denormalizedCase['events.hospitalized']).toEqual('');
        expect(denormalizedCase['events.reasonForHospitalization']).toEqual('');
        expect(denormalizedCase['events.dateHospitalization']).toEqual('');
        expect(denormalizedCase['events.dateDischargeHospital']).toEqual('');
        expect(denormalizedCase['events.intensiveCare']).toEqual('');
        expect(denormalizedCase['events.dateAdmissionICU']).toEqual('');
        expect(denormalizedCase['events.dateDischargeICU']).toEqual('');
        expect(denormalizedCase['events.homeMonitoring']).toEqual('');
        expect(denormalizedCase['events.isolated']).toEqual('');
        expect(denormalizedCase['events.dateIsolation']).toEqual('');
        expect(denormalizedCase['events.outcome']).toEqual('');
        expect(denormalizedCase['events.dateDeath']).toEqual('');
        expect(denormalizedCase['events.dateRecovered']).toEqual('');

        expect(denormalizedCase['location.country']).toEqual('');
        expect(denormalizedCase['location.countryISO3']).toEqual('');
        expect(denormalizedCase['location.location']).toEqual('');
        expect(denormalizedCase['location.place']).toEqual('');
        expect(denormalizedCase['location.geoResolution']).toEqual('');
        expect(denormalizedCase['location.geometry.latitude']).toEqual('');
        expect(denormalizedCase['location.geometry.longitude']).toEqual('');

        expect(denormalizedCase['pathogen']).toEqual('');
        expect(denormalizedCase['caseStatus']).toEqual('');
        expect(denormalizedCase['symptoms']).toEqual('');

        expect(
            denormalizedCase['preexistingConditions.previousInfection'],
        ).toEqual('');
        expect(denormalizedCase['preexistingConditions.coInfection']).toEqual(
            '',
        );
        expect(
            denormalizedCase['preexistingConditions.preexistingCondition'],
        ).toEqual('');
        expect(
            denormalizedCase['preexistingConditions.pregnancyStatus'],
        ).toEqual('');

        expect(denormalizedCase['transmission.contactWithCase']).toEqual('');
        expect(denormalizedCase['transmission.contactId']).toEqual('');
        expect(denormalizedCase['transmission.contactSetting']).toEqual('');
        expect(denormalizedCase['transmission.contactAnimal']).toEqual('');
        expect(denormalizedCase['transmission.contactComment']).toEqual('');
        expect(denormalizedCase['transmission.transmission']).toEqual('');

        expect(denormalizedCase['travelHistory.travelHistory']).toEqual('');
        expect(denormalizedCase['travelHistory.travelHistoryEntry']).toEqual(
            '',
        );
        expect(denormalizedCase['travelHistory.travelHistoryStart']).toEqual(
            '',
        );
        expect(denormalizedCase['travelHistory.travelHistoryLocation']).toEqual(
            '',
        );
        expect(denormalizedCase['travelHistory.travelHistoryCountry']).toEqual(
            '',
        );

        expect(denormalizedCase['vaccination.vaccination']).toEqual('');
        expect(denormalizedCase['vaccination.vaccineName']).toEqual('');
        expect(denormalizedCase['vaccination.vaccineDate']).toEqual('');
        expect(denormalizedCase['vaccination.vaccineSideEffects']).toEqual('');

        expect(denormalizedCase['genomeSequences.genomicsMetadata']).toEqual(
            '',
        );
        expect(denormalizedCase['genomeSequences.accessionNumber']).toEqual('');
    });
    it('denormalizes case reference fields', async () => {
        const caseRefDoc = {
            sourceId: 'a source id',
            sourceEntryId: 'a source entry id',
            sourceUrl: 'global.health',
            uploadIds: ['id a', 'id b'],
            additionalSources: [
                { sourceUrl: 'google.com' },
                { sourceUrl: 'ap.org' },
            ],
        } as CaseReferenceDocument;

        const caseDoc = {
            caseReference: caseRefDoc,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            symptoms: '',
            caseStatus: '',
            preexistingConditions: {} as PreexistingConditionsDocument,

            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['caseReference.sourceId']).toEqual(
            'a source id',
        );
        expect(denormalizedCase['caseReference.sourceEntryId']).toEqual(
            'a source entry id',
        );
        expect(denormalizedCase['caseReference.sourceUrl']).toEqual(
            'global.health',
        );
        expect(denormalizedCase['caseReference.uploadIds']).toEqual(
            'id a,id b',
        );
        expect(denormalizedCase['caseReference.additionalSources']).toEqual(
            'google.com,ap.org',
        );
    });
    it('denormalizes demographics fields', async () => {
        const anAgeBucket = await AgeBucket.findOne({ start: 41 });
        const demographicsDoc = {
            ageBuckets: [anAgeBucket._id],
            gender: 'male',
            occupation: 'Anesthesiologist',
            healthcareWorker: 'Y',
        } as DemographicsDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: demographicsDoc,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['demographics.ageRange.end']).toEqual(45);
        expect(denormalizedCase['demographics.ageRange.start']).toEqual(41);
        expect(denormalizedCase['demographics.gender']).toEqual('male');
        expect(denormalizedCase['demographics.occupation']).toEqual(
            'Anesthesiologist',
        );
        expect(denormalizedCase['demographics.healthcareWorker']).toEqual('Y');
    });
    it('denormalizes events fields', async () => {
        const eventsDoc = {
            dateEntry: new Date('2020-11-01'),
            dateOnset: new Date('2020-11-02'),
            dateConfirmation: new Date('2020-11-03'),
        } as EventsDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: eventsDoc,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,

            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['events.dateEntry']).toEqual(
            eventsDoc.dateEntry.toDateString(),
        );
        expect(denormalizedCase['events.dateOnset']).toEqual(
            eventsDoc.dateOnset?.toDateString(),
        );
        expect(denormalizedCase['events.dateConfirmation']).toEqual(
            eventsDoc.dateConfirmation?.toDateString(),
        );
        expect(denormalizedCase['events.confirmationMethod']).toEqual('');
        expect(denormalizedCase['events.dateOfFirstConsult']).toEqual('');
        expect(denormalizedCase['events.hospitalized']).toEqual('');
        expect(denormalizedCase['events.reasonForHospitalization']).toEqual('');
        expect(denormalizedCase['events.dateHospitalization']).toEqual('');
        expect(denormalizedCase['events.dateDischargeHospital']).toEqual('');
        expect(denormalizedCase['events.intensiveCare']).toEqual('');
        expect(denormalizedCase['events.dateAdmissionICU']).toEqual('');
        expect(denormalizedCase['events.dateDischargeICU']).toEqual('');
        expect(denormalizedCase['events.homeMonitoring']).toEqual('');
        expect(denormalizedCase['events.isolated']).toEqual('');
        expect(denormalizedCase['events.dateIsolation']).toEqual('');
        expect(denormalizedCase['events.outcome']).toEqual('');
        expect(denormalizedCase['events.dateDeath']).toEqual('');
        expect(denormalizedCase['events.dateRecovered']).toEqual('');
    });
    it('denormalizes location fields', async () => {
        const locationDoc = {
            country: 'Georgia',
            countryISO3: 'GEO',
            name: 'Tbilisi',
            place: 'Tibilisi',
            geoResolution: 'Point',
            geometry: {
                latitude: 41.7151,
                longitude: 44.8271,
            },
        } as LocationDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: locationDoc,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,

            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['location.country']).toEqual(
            locationDoc.country,
        );
        expect(denormalizedCase['location.countryISO3']).toEqual('GEO');
        expect(denormalizedCase['location.place']).toEqual(locationDoc.place);
        expect(denormalizedCase['location.geoResolution']).toEqual(
            locationDoc.geoResolution,
        );
        expect(denormalizedCase['location.geometry.latitude']).toEqual(
            locationDoc.geometry.latitude,
        );
        expect(denormalizedCase['location.geometry.longitude']).toEqual(
            locationDoc.geometry.longitude,
        );
    });
    it('denormalizes preexisting conditions fields', async () => {
        const conditionsDoc = {
            previousInfection: 'Y',
            coInfection: 'Flu',
            preexistingCondition: '',
            pregnancyStatus: 'NA',
        } as PreexistingConditionsDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: conditionsDoc,

            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);
        expect(
            denormalizedCase['preexistingConditions.previousInfection'],
        ).toEqual('Y');
        expect(denormalizedCase['preexistingConditions.coInfection']).toEqual(
            'Flu',
        );
        expect(
            denormalizedCase['preexistingConditions.preexistingCondition'],
        ).toEqual('');
        expect(
            denormalizedCase['preexistingConditions.pregnancyStatus'],
        ).toEqual('NA');
    });
    it('denormalizes transmission fields', async () => {
        const transmissionDoc = {
            contactWithCase: 'Y',
            contactId: 'abc123',
            contactSetting: 'setting',
            contactAnimal: 'animal',
            contactComment: 'comment',
            transmission: 'transmission',
        } as TransmissionDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,
            transmission: transmissionDoc,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['transmission.contactWithCase']).toEqual('Y');
        expect(denormalizedCase['transmission.contactId']).toEqual('abc123');
        expect(denormalizedCase['transmission.contactSetting']).toEqual(
            'setting',
        );
        expect(denormalizedCase['transmission.contactAnimal']).toEqual(
            'animal',
        );
        expect(denormalizedCase['transmission.contactComment']).toEqual(
            'comment',
        );
        expect(denormalizedCase['transmission.transmission']).toEqual(
            'transmission',
        );
    });
    it('denormalizes travel history fields', async () => {
        const travelHistoryDoc = {
            travelHistory: 'Y',
            travelHistoryEntry: new Date('2020-11-01'),
            travelHistoryStart: 'start',
            travelHistoryLocation: 'London',
            travelHistoryCountry: 'United Kingdom',
        } as TravelHistoryDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: travelHistoryDoc,
            vaccination: {} as VaccineDocument,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['travelHistory.travelHistory']).toEqual('Y');
        expect(denormalizedCase['travelHistory.travelHistoryEntry']).toEqual(
            travelHistoryDoc.travelHistoryEntry.toDateString(),
        );
        expect(denormalizedCase['travelHistory.travelHistoryStart']).toEqual(
            'start',
        );
        expect(denormalizedCase['travelHistory.travelHistoryLocation']).toEqual(
            'London',
        );
        expect(denormalizedCase['travelHistory.travelHistoryCountry']).toEqual(
            'United Kingdom',
        );
    });
    it('denormalizes vaccine fields', async () => {
        const vaccinationDoc = {
            vaccination: 'Y',
            vaccineName: 'Pfizer',
            vaccineDate: new Date('2020-11-01'),
            vaccineSideEffects: 'cough',
        } as VaccineDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: vaccinationDoc,
            genomeSequences: {} as GenomeSequenceDocument,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);
        expect(denormalizedCase['vaccination.vaccination']).toEqual('Y');
        expect(denormalizedCase['vaccination.vaccineName']).toEqual('Pfizer');
        expect(denormalizedCase['vaccination.vaccineDate']).toEqual(
            vaccinationDoc.vaccineDate.toDateString(),
        );
        expect(denormalizedCase['vaccination.vaccineSideEffects']).toEqual(
            'cough',
        );
    });
    it('denormalizes genome sequences fields', async () => {
        const genomeSequencesDoc = {
            genomicsMetadata: 'metadata',
            accessionNumber: '1234',
        } as GenomeSequenceDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: {} as EventDocument,
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogen: '',
            caseStatus: '',
            symptoms: '',
            preexistingConditions: {} as PreexistingConditionsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccination: {} as VaccineDocument,
            genomeSequences: genomeSequencesDoc,
        } as CaseDocument;

        const denormalizedCase = await denormalizeFields(caseDoc);

        expect(denormalizedCase['genomeSequences.genomicsMetadata']).toEqual(
            'metadata',
        );
        expect(denormalizedCase['genomeSequences.accessionNumber']).toEqual(
            '1234',
        );
    });
});
