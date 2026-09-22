import { NextRequest } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest
) {
  try {
    const year = req.nextUrl.searchParams.get("year");

    if (!year) {
      return new Response("Anno mancante", { status: 400 });
    }

    const supabase = createClient();
    const zip = new JSZip();

    const bucket = supabase.storage.from("tournament-files");

    // ============================================================
    // 1. PRENDE TUTTE LE CARTELLE PRESENTI IN match-media
    // ============================================================

    const { data: folders, error: foldersError } = await bucket.list(
      "match-media",
      {
        limit: 1000,
        offset: 0,
        sortBy: {
          column: "name",
          order: "asc",
        },
      }
    );

    if (foldersError) {
      throw foldersError;
    }

    const realFolders = (folders || []).filter(
      (item) => item.id === null
    );

    // ============================================================
    // 2. PER OGNI CARTELLA PRENDE TUTTI I FILE
    // ============================================================

    for (const folder of realFolders) {
      const folderName = folder.name;
      const folderPath = `match-media/${folderName}`;

      const { data: files, error: filesError } =
        await bucket.list(folderPath, {
          limit: 1000,
          offset: 0,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (filesError) {
        console.error(
          `Errore lettura cartella ${folderName}:`,
          filesError
        );
        continue;
      }

      // ==========================================================
      // 3. SCARICA OGNI FILE E LO INSERISCE NELLA CARTELLA ZIP
      // ==========================================================

      for (const file of files || []) {
        // Ignora eventuali sottocartelle
        if (!file.id) continue;

        const filePath = `${folderPath}/${file.name}`;

        const { data: fileData, error: downloadError } =
          await bucket.download(filePath);

        if (downloadError || !fileData) {
          console.error(
            `Errore download ${filePath}:`,
            downloadError
          );
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();

        zip
          .folder(folderName)
          ?.file(file.name, arrayBuffer);
      }
    }

    // ============================================================
    // 4. GENERA ZIP
    // ============================================================

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    });

    // ============================================================
    // 5. SALVA LO ZIP NELLO STORAGE
    // ============================================================

    const zipPath =
      `albo-doro/${year}/media-trofeo-${year}.zip`;

    const { error: uploadError } =
      await bucket.upload(
        zipPath,
        zipBuffer,
        {
          contentType: "application/zip",
          cacheControl: "3600",
          upsert: true,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // ============================================================
    // 6. URL PUBBLICO
    // ============================================================

    const { data: publicData } =
      bucket.getPublicUrl(zipPath);

    return Response.json({
      success: true,
      url: publicData.publicUrl,
      folders: realFolders.length,
    });

  } catch (error) {
    console.error(
      "Errore generazione archivio Albo d'Oro:",
      error
    );

    return new Response(
      "Errore generazione archivio",
      { status: 500 }
    );
  }
}
