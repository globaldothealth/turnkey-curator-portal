import { VaccineDocument, vaccineSchema } from '../../src/model/vaccine';
import { YesNo } from '../../src/types/enums';

import mongoose from 'mongoose';

const Vaccine = mongoose.model<VaccineDocument>('Vaccine', vaccineSchema);

describe('validate', () => {
    it('vaccine model with various fields filled is valid', async () => {
        const aVaccine = new Vaccine({
            vaccination: YesNo.Y,
            vaccineName: 'Moderna',
            vaccineDate: '2022-02-01',
            vaccineSideEffects: '',
        });
        return aVaccine.validate();
    });
});
