import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { organizationId } = req.query;
    const activeOnly = req.query.activeOnly !== 'false';

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid organizationId query parameter' 
      });
    }

    // Verify organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ 
        success: false, 
        error: 'Organization not found' 
      });
    }

    // Get hotels - ✅ Schema reale: property_code = nome hotel, property_id = INTEGER PK
    // ✅ FILTRO CRITICO: organization_id per multi-tenancy
    let query = supabase
      .from('organization_hotels')
      .select(`
        property_id,
        property_code,
        nome_marketing,
        organization_id,
        is_active,
        citta,
        indirizzo,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)  // ← FILTRO CRITICO per multi-tenancy
      .order('property_code', { ascending: true });  // ← Ordina per nome hotel

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: hotels, error: hotelsError } = await query;

    if (hotelsError) throw hotelsError;

    // ✅ Mappa colonne DB → formato API (property_id INTEGER → string)
    const formattedHotels = hotels?.map(h => ({
      id: h.property_id.toString(),              // INTEGER → STRING
      hotelName: h.property_code || 'Unnamed',   // property_code = nome hotel
      hotelDisplayName: h.nome_marketing,        // Nome commerciale
      hotelIdInPms: null,                        // Non esiste più
      propertyCode: h.property_code,             // property_code
      city: h.citta,                             // citta
      country: null,                             // Non disponibile
      isActive: h.is_active ?? true,
      syncEnabled: false,                        // Non disponibile
      lastSyncAt: null,                          // Non disponibile
      createdAt: h.created_at
    })) || [];

    return res.status(200).json({
      success: true,
      data: {
        organizationId,
        organizationName: organization.name,
        totalHotels: formattedHotels.length,
        hotels: formattedHotels
      }
    });

  } catch (error: any) {
    console.error('[API hotels] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error'
    });
  }
}
