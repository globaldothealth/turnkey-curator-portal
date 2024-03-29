import { Error } from 'mongoose';
import { dateFieldInfo } from '../../src/model/date';
import mongoose from 'mongoose';

/** A fake model with a field using the date schema. */
const outbreakDate = new Date('2019-11-01');

const FakeModel = mongoose.model(
    'FakeDocument',
    new mongoose.Schema({
        date: dateFieldInfo(outbreakDate),
    }),
);

describe('validate', () => {
    it('a type other than Date is invalid', async () => {
        return new FakeModel({ date: 'not-a-date' }).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('a date before the start of the outbreak is invalid', async () => {
        return new FakeModel({ date: new Date('2019-10-31') }).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('a date too far in the future is invalid', async () => {
        return new FakeModel({
            date: new Date(Date.now() + 10000 /* seconds */),
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

    it('a date ISO date form is valid', async () => {
        return new FakeModel({ date: '2019-11-01' }).validate();
    });

    it('a date in ISO date-time form is valid', async () => {
        return new FakeModel({ date: '2020-05-10T14:48:00' }).validate();
    });

    it('a date in ISO date-time + ms + tz form is valid', async () => {
        return new FakeModel({
            date: '2020-05-10T14:48:00.000+09:00',
        }).validate();
    });
});
