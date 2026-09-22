import { NextRequest } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const year = req.nextUrl.searchParams.get("year");

    if (!year) {
      return new Response("Anno mancante", { status: 400 });
    }

    const supabase = createClient();
    const zip = new JSZip();
    const bucket = supabase.storage.from("tournament-files");

    // Legge TUTTI gli elementi (anche oltre 1000)
    const listAll = async (path: string) => {
      const pageSize = 1000;
      let offset = 0;
      const all: any[] = [];

      while (true) {
        const { data, error } = await bucket.list(path, {
          limit: pageSize,
          offset,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

        if (error) throw error;

        const items = data || [];
        all.push(...items);

        if (items.length < pageSize) break;
        offset += pageSize;
      }

      return all;
    };

    // Tutte le cartelle presenti in match-media
    const folders = await listAll("match-media");
    const realFolders = folders.filter((f) => f.id === null);

    for (const folder of realFolders) {
      const folderName = folder.name;
      const folderPath = `match-media/${folderName}`;

      zip.folder(folderName);

      const files = await listAll(folderPath);

      for (const file of files) {
        if (!file.id) continue;

        const filePath = `${folderPath}/${file.name}`;

        const { data } = await bucket.download(filePath);
        if (!data) continue;

        const buffer = await data.arrayBuffer();

        zip.folder(folderName)?.file(file.name, buffer);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const zipPath = `albo-doro/${year}/media-trofeo-${year}.zip`;

    const { error } = await bucket.upload(zipPath, zipBuffer, {
      upsert: true,
      contentType: "application/zip",
    });

    if (error) throw error;

    const { data: publicUrl } = bucket.getPublicUrl(zipPath);

    return Response.json({
      success: true,
      url: publicUrl.publicUrl,
    });

  } catch (err) {
    console.error(err);
    return new Response("Errore generazione archivio", {
      status: 500,
    });
  }
}
