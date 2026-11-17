import { PromptBuilder } from '../../src/ai/promptBuilder';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  describe('buildPrompt()', () => {
    it('should sanitize schema and combine with user question', () => {
      const schema = {
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'revenue', type: 'DOUBLE' },
          { name: 'date', type: 'TIMESTAMP' }
        ],
        sampleData: [
          { id: 1, revenue: 100.5, date: '2023-01-01' },
          { id: 2, revenue: 200.0, date: '2023-01-02' }
        ]
      };

      const question = "Show monthly revenue trends";
      const prompt = builder.buildPrompt(schema, question);

      expect(prompt).toContain('Table "orders"');
      expect(prompt).toContain('id INTEGER');
      expect(prompt).toContain('revenue DOUBLE');
      expect(prompt).toContain('date TIMESTAMP');
      expect(prompt).toContain(question);
      expect(prompt).toContain('OUTPUT INSTRUCTIONS');
    });

    it('should limit sample data to prevent token overflow', () => {
      const schema = {
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'value', type: 'DOUBLE' }
        ],
        sampleData: Array.from({length: 100}, (_, i) => ({ id: i, value: i * 1.5 }))
      };

      const prompt = builder.buildPrompt(schema, "Test question");

      expect(prompt).toContain('id: 0, value: 0');
      expect(prompt).toContain('id: 1, value: 1.5');
      expect(prompt).toContain('id: 2, value: 3');
      expect(prompt).not.toContain('id: 99, value: 148.5');
    });

    it('should use custom tableName when provided', () => {
      const schema = {
        columns: [{ name: 'id', type: 'INTEGER' }],
        sampleData: [{ id: 1 }]
      };

      const prompt = builder.buildPrompt(schema, "Test", "sales_data");
      expect(prompt).toContain('Table "sales_data"');
    });

    it('should include column stats when provided', () => {
      const schema = {
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'category', type: 'VARCHAR' }
        ],
        sampleData: [{ id: 1, category: 'A' }],
        columnStats: {
          id: { distinct: 5, nulls: 0, min: 1, max: 5 },
          category: { distinct: 3, nulls: 0, min: 'A', max: 'C' }
        }
      };

      const prompt = builder.buildPrompt(schema, "Test");
      expect(prompt).toContain('-- id: distinct=5, nulls=0, min=1, max=5');
      expect(prompt).toContain('-- category: distinct=3, nulls=0, min=A, max=C');
    });

    it('should truncate sample data to 3 rows', () => {
      const schema = {
        columns: [{ name: 'id', type: 'INTEGER' }],
        sampleData: Array.from({length: 10}, (_, i) => ({ id: i }))
      };

      const prompt = builder.buildPrompt(schema, "Test");
      expect(prompt).toContain('id: 0');
      expect(prompt).toContain('id: 1');
      expect(prompt).toContain('id: 2');
      expect(prompt).not.toContain('id: 3');
    });

    it('should limit distinct values to 10 per categorical column', () => {
      const schema = {
        columns: [
          { name: 'category', type: 'VARCHAR' }
        ],
        sampleData: [{ category: 'A' }],
        columnStats: {
          category: { distinct: 15, nulls: 0, min: 'A', max: 'O' }
        }
      };

      const prompt = builder.buildPrompt(schema, "Test");
      expect(prompt).toContain('distinct=15');
    });
  });
});