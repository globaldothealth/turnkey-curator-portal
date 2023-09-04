import { Admin } from '../../src/model/admin';

describe('Admin schema', () => {
    it('should build a valid admin', () => {
        const errors = new Admin({
            id: 'foo',
            name: 'bar',
        }).validateSync();
        expect(errors).toBeUndefined();
    });

    it('should fail validation if invalid', () => {
        const errors = new Admin({}).validateSync();
        expect(errors).toBeDefined();
        expect(errors?.toString()).toMatch('id: Path `id` is required.');
        expect(errors?.toString()).toMatch('Admin must have a name');
    });
});
