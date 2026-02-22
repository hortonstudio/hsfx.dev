const WEBFLOW_API_BASE = "https://api.webflow.com/v2";

function getHeaders(): HeadersInit {
  const token = process.env.WEBFLOW_API_TOKEN;
  if (!token) throw new Error("WEBFLOW_API_TOKEN not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

function getCollectionId(): string {
  const id = process.env.WEBFLOW_COLLECTION_ID;
  if (!id) throw new Error("WEBFLOW_COLLECTION_ID not configured");
  return id;
}

export async function createCmsItem(
  fields: Record<string, unknown>
): Promise<{ id: string; fieldData: Record<string, unknown> }> {
  const collectionId = getCollectionId();
  const res = await fetch(
    `${WEBFLOW_API_BASE}/collections/${collectionId}/items`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        isArchived: false,
        isDraft: false,
        fieldData: fields,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Webflow createCmsItem failed: ${err.message || err.msg || res.statusText}`
    );
  }

  return res.json();
}

export async function updateCmsItem(
  itemId: string,
  fields: Record<string, unknown>
): Promise<{ id: string; fieldData: Record<string, unknown> }> {
  const collectionId = getCollectionId();
  const res = await fetch(
    `${WEBFLOW_API_BASE}/collections/${collectionId}/items/${itemId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        isArchived: false,
        isDraft: false,
        fieldData: fields,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Webflow updateCmsItem failed: ${err.message || err.msg || res.statusText}`
    );
  }

  return res.json();
}

export async function publishCmsItem(itemId: string): Promise<void> {
  const collectionId = getCollectionId();
  const res = await fetch(
    `${WEBFLOW_API_BASE}/collections/${collectionId}/items/publish`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ itemIds: [itemId] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Webflow publishCmsItem failed: ${err.message || err.msg || res.statusText}`
    );
  }
}
