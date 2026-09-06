-- HomeStride Services initial service catalogue
-- Prices are fictional and used for portfolio demonstration.

INSERT INTO services (
  name,
  description,
  base_price,
  estimated_duration_minutes
)
VALUES
  (
    'Plumbing',
    'Repairs and maintenance for leaking taps, blocked drains, pipes and household water systems.',
    150.00,
    120
  ),
  (
    'Electrical Services',
    'Household electrical troubleshooting, fixture installation, socket repairs and maintenance.',
    180.00,
    120
  ),
  (
    'Home Cleaning',
    'General residential cleaning for rooms, kitchens, bathrooms and shared living spaces.',
    250.00,
    240
  ),
  (
    'Air Conditioner Servicing',
    'Inspection, cleaning and routine servicing of residential air-conditioning systems.',
    220.00,
    120
  ),
  (
    'Carpentry',
    'Repairs and installation support for doors, cabinets, shelves and other wooden fixtures.',
    200.00,
    180
  ),
  (
    'Painting',
    'Interior and exterior painting support for residential rooms and properties.',
    300.00,
    480
  ),
  (
    'Appliance Repairs',
    'Assessment and repair support for common household electrical appliances.',
    180.00,
    150
  )
ON CONFLICT (name)
DO UPDATE SET
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  estimated_duration_minutes =
    EXCLUDED.estimated_duration_minutes,
  is_active = TRUE;