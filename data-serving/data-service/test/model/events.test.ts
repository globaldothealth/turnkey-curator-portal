import { EventsDocument, EventsSchema } from '../../src/model/events';

import fullModel from './data/event.full.json';
import minimalModel from './data/event.minimal.json';
import mongoose from 'mongoose';

const Events = mongoose.model<EventsDocument>('Events', EventsSchema);

describe('validate', () => {
    it('minimal events are valid', async () => {
        return new Events(minimalModel).validate();
    });

    it('a fully specified event is valid', async () => {
        return new Events(fullModel).validate();
    });
});
