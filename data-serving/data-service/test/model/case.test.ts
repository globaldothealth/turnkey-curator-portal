import { Day0Case } from '../../src/model/day0-case';
import { Error } from 'mongoose';
import fullModel from './data/case.full.json';
import minimalEvent from './data/event.minimal.json';
import minimalModel from './data/case.minimal.json';

describe('validate', () => {
    it('model without caseReference is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noCaseReference: any = { ...minimalModel };
        delete noCaseReference.caseReference;

        return new Day0Case({ ...noCaseReference }).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('model without events is invalid', async () => {
        return new Day0Case({ ...minimalModel, events: [] }).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('model without date entry event is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noDateEntry: any = { ...minimalEvent };
        delete noDateEntry.dateEntry;

        return new Day0Case({
            ...minimalModel,
            events: noDateEntry,
        })
            .validate()
            .then(
                () => null,
                (e) => {
                    expect(e).not.toBeNull();
                    if (e) expect(e.name).toBe(Error.ValidationError.name);
                },
            );
    });

    it('model without date reported event is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noDateReported: any = { ...minimalEvent };
        delete noDateReported.dateReported;

        return new Day0Case({
            ...minimalModel,
            events: noDateReported,
        })
            .validate()
            .then(
                () => null,
                (e) => {
                    expect(e).not.toBeNull();
                    if (e) expect(e.name).toBe(Error.ValidationError.name);
                },
            );
    });

    it('minimal model is valid', async () => {
        return new Day0Case(minimalModel).validate();
    });

    it('fully-specified model is valid', async () => {
        return new Day0Case(fullModel).validate();
    });
});

describe('custom instance methods', () => {
    it('equalsJSON returns true for identical case', () => {
        const c = new Day0Case(fullModel);
        expect(c.equalsJSON(fullModel)).toBe(true);
    });
    it('equalsJSON returns true for case differing in caseReference', () => {
        const c = new Day0Case(fullModel);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const comparison: any = fullModel;
        delete comparison.caseReference;
        expect(c.equalsJSON(comparison)).toBe(true);
    });
    it('equalsJSON returns false for semantically differing case', () => {
        const c = new Day0Case(fullModel);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const comparison: any = fullModel;
        delete comparison.demographics.gender;
        expect(c.equalsJSON(comparison)).toBe(false);
    });
});
