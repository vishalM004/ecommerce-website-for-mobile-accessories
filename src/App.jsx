import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

/* LOGOS */

import appleLogo from "./assets/logos/apple.svg";
import samsungLogo from "./assets/logos/samsung.png";
import oppoLogo from "./assets/logos/oppo.png";
import vivoLogo from "./assets/logos/vivo.svg";
import xiaomiLogo from "./assets/logos/xiaomi.svg";
import motorolaLogo from "./assets/logos/motorola1.svg";
import oneplusLogo from "./assets/logos/oneplus.svg";
import iqooLogo from "./assets/logos/iqoo.svg";
import realmeLogo from "./assets/logos/realme.svg";
import redmiLogo from "./assets/logos/redmi.svg";
import pocoLogo from "./assets/logos/poco.svg";

/* PHONE IMAGES */

const getPhoneImage = (model) => {
  if (!model) return null;

  const filename = model
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  return `/phones/${filename}.png`;
};

function highlightModel(text, search) {
  if (!text || !search.trim()) return text;

  const searchText = search.trim();

  const escapedSearch = searchText.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedSearch})`, "gi");

  return text.split(regex).map((part, index) => {
    if (part.toLowerCase() === searchText.toLowerCase()) {
      return (
        <span
          key={index}
          className="bg-cyan-400 text-black px-1.5 rounded-md font-bold"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

export default function App() {

const [phones, setPhones] = useState([]);
const [search, setSearch] = useState("");
const [products, setProducts] = useState([]);
const [submitted, setSubmitted] = useState(false);
const [searchMode, setSearchMode] = useState("phones");
const [expandedTemper, setExpandedTemper] = useState(null);
const [selectedPhone, setSelectedPhone] = useState(null);
const [phoneImage, setPhoneImage] = useState(null);
const [imageLoading, setImageLoading] = useState(false);
const [loading, setLoading] = useState(true);

  const brands = [
    "Apple",
    "Samsung",
    "OPPO",
    "Vivo",
    "IQOO",
    "Redmi",
    "Xiaomi",
    "Poco",
    "Motorola",
    "Realme",
    "OnePlus",
  ];

  const brandIcons = {
    Apple: appleLogo,
    Samsung: samsungLogo,
    OPPO: oppoLogo,
    Vivo: vivoLogo,
    IQOO: iqooLogo,
    Redmi: redmiLogo,
    Xiaomi: xiaomiLogo,
    Poco: pocoLogo,
    Motorola: motorolaLogo,
    Realme: realmeLogo,
    OnePlus: oneplusLogo,
  };

  useEffect(() => {
    fetchPhones();
  }, []);
 useEffect(() => {
  const loadPhoneImage = async () => {
    if (!selectedPhone?.model) {
      setPhoneImage(null);
      setImageLoading(false);
      return;
    }

    // 1. Use cached Supabase image
    if (selectedPhone.image_url) {
      setPhoneImage(selectedPhone.image_url);
      setImageLoading(false);
      return;
    }

    setPhoneImage(null);
    setImageLoading(true);

    // 2. Check user's local PNG
    const localImage = getPhoneImage(selectedPhone.model);
    const testImage = new Image();

    testImage.onload = () => {
      setPhoneImage(localImage);
      setImageLoading(false);
    };

    testImage.onerror = () => {
      // 3. Check user's local WebP
      const webpImage = localImage.replace(".png", ".webp");
      const testWebP = new Image();

      testWebP.onload = () => {
        setPhoneImage(webpImage);
        setImageLoading(false);
      };

      testWebP.onerror = async () => {
        // 4. No local image → MobileAPI
        const { data, error } =
          await supabase.functions.invoke(
            "dynamic-service",
            {
              body: {
                model: selectedPhone.model,
                brand: selectedPhone.brand,
              },
            }
          );

        if (!error && data?.image_url) {
          setPhoneImage(data.image_url);
        } else {
          setPhoneImage(null);
        }

        setImageLoading(false);
      };

      testWebP.src = webpImage;
    };

    testImage.src = localImage;
  };

  loadPhoneImage();
}, [selectedPhone]);

  async function fetchPhones() {
  try {
    // Get all phone models
    const { data: phoneData, error: phoneError } = await supabase
      .from("phones_v2")
      .select("id, brand, model, image_url");

    if (phoneError) {
      console.error("Phones error:", phoneError);
      return;
    }

    // Get all tempered-glass compatibility relationships
    const { data: compatibilityData, error: compatibilityError } =
      await supabase
        .from("tempered_compatibility")
        .select("group_id, phone_id, fit");

    if (compatibilityError) {
      console.error("Compatibility error:", compatibilityError);
      return;
    }

    // Get tempered-glass groups
    const { data: groupData, error: groupError } = await supabase
      .from("tempered_groups")
      .select("group_id, reference_model, fit");

    if (groupError) {
      console.error("Groups error:", groupError);
      return;
    }
    // Get active products
const { data: productData, error: productError } = await supabase
  .from("products")
  .select(
    "id, product_name, category, brand, price, sale_price, description, image_url, stock, is_active"
  )
  .eq("is_active", true);

if (productError) {
  console.error("Products error:", productError);
  return;
}

// Get product-phone compatibility
const { data: productCompatibilityData, error: productCompatibilityError } =
  await supabase
    .from("product_compatibility")
    .select("product_id, phone_id");

if (productCompatibilityError) {
  console.error(
    "Product compatibility error:",
    productCompatibilityError
  );
  return;
}

setProducts(productData || []);

    // Connect everything together
    const combinedPhones = phoneData.map((phone) => {
      const matches = compatibilityData
        .filter((item) => item.phone_id === phone.id)
        .map((item) => {
          const group = groupData.find(
            (g) => g.group_id === item.group_id
          );

          return {
            group_id: item.group_id,
            reference_model: group?.reference_model || "Unknown",
            fit: item.fit,
          };
        });
        
        const productMatches = productCompatibilityData
  .filter((item) => {
    const compatiblePhone = phoneData.find(
      (p) => p.id === item.phone_id
    );

    if (!compatiblePhone) return false;

    const currentPhoneKey =
      `${phone.brand}|${phone.model}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const compatiblePhoneKey =
      `${compatiblePhone.brand}|${compatiblePhone.model}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    return (
      item.phone_id === phone.id ||
      compatiblePhoneKey === currentPhoneKey
    );
  })
  .map((item) =>
    productData.find(
      (product) =>
        String(product.id).trim() ===
        String(item.product_id).trim()
)
  )
  .filter(Boolean);


      return {
  id: phone.id,
  brand: phone.brand,
  model: phone.model,
  image_url: phone.image_url,
  temperedGroups: matches,
  compatibleProducts: productMatches,
};
    });

    setPhones(combinedPhones);
    console.log("TOTAL PHONES:", combinedPhones.length);
console.log("FIRST PHONE:", combinedPhones[0]);
console.log("ALL PHONES:", combinedPhones);

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

  const normalizeSearch = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const levenshteinDistance = (a, b) => {
  if (!a) return b.length;
  if (!b) return a.length;

  const matrix = Array.from(
    { length: b.length + 1 },
    () => Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + 1
            );
    }
  }

  return matrix[b.length][a.length];
};

const getSearchScore = (phone, query) => {
  if (!query.trim()) return 0;

  const brandAliases = {
    ip: "iphone",
    iphone: "iphone",

    sam: "samsung",
    samsung: "samsung",

    galxy: "galaxy",
    galaxy: "galaxy",

    opp: "oppo",
    oppo: "oppo",

    viv: "vivo",
    vivo: "vivo",

    iq: "iqoo",
    iqoo: "iqoo",

    red: "redmi",
    redmi: "redmi",

    xia: "xiaomi",
    xiaomi: "xiaomi",

    poc: "poco",
    poco: "poco",

    mot: "motorola",
    moto: "motorola",
    motorola: "motorola",

    real: "realme",
    realme: "realme",

    one: "oneplus",
    oneplus: "oneplus",
  };

  const clean = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalize = (text) =>
    clean(text).replace(/\s/g, "");

  const levenshtein = (a, b) => {
    if (!a || !b) return Math.max(a.length, b.length);

    const matrix = Array.from(
      { length: a.length + 1 },
      () => Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const queryClean = clean(query);
  const queryWords = queryClean.split(" ").filter(Boolean);
  const queryNormalized = normalize(query);

  const phoneModel = clean(phone.model);
  const phoneBrand = clean(phone.brand);

  const phoneModelNormalized = normalize(phone.model);
  const phoneBrandNormalized = normalize(phone.brand);

  let bestScore = 0;

  /*
   * ----------------------------------------------------
   * 1. BRAND SEARCH
   * ----------------------------------------------------
   * Handles:
   * re
   * realme
   * realmee
   * oppo
   * opp
   * vivo
   * samsung
   * sam
   * iphone
   * ip
   * etc.
   */

  const possibleBrand =
    queryWords.length === 1
      ? brandAliases[queryWords[0]] || queryWords[0]
      : null;

  if (possibleBrand) {
    const brandQuery = normalize(possibleBrand);

    if (
      phoneBrandNormalized === brandQuery
    ) {
      bestScore = Math.max(bestScore, 120000);
    }

    if (
      phoneBrandNormalized.startsWith(brandQuery)
    ) {
      bestScore = Math.max(bestScore, 110000);
    }

    if (
      phoneBrandNormalized.includes(brandQuery)
    ) {
      bestScore = Math.max(bestScore, 100000);
    }

    const brandDistance = levenshtein(
      queryNormalized,
      phoneBrandNormalized
    );

    const allowedBrandDistance =
      queryNormalized.length <= 3
        ? 1
        : queryNormalized.length <= 6
        ? 2
        : 3;

    if (brandDistance <= allowedBrandDistance) {
      bestScore = Math.max(
        bestScore,
        90000 - brandDistance * 1000
      );
    }
  }

  /*
   * ----------------------------------------------------
   * 2. NORMAL MODEL SEARCH
   * ----------------------------------------------------
   */

  const getModelKey = (text) => {
    const words = clean(text)
      .split(" ")
      .filter(Boolean);

    const modelWords = words.filter((word) => {
      const mapped = brandAliases[word];

      if (mapped) return false;

      if (
        [
          "phone",
          "mobile",
          "smartphone",
          "apple",
        ].includes(word)
      ) {
        return false;
      }

      return true;
    });

    return modelWords.join("");
  };

  const searchKey = getModelKey(query);

  if (searchKey) {
    /*
     * ACTUAL PHONE MODEL
     */

    if (phoneModelNormalized === searchKey) {
      bestScore = Math.max(bestScore, 100000);
    } else if (
      phoneModelNormalized.startsWith(searchKey)
    ) {
      bestScore = Math.max(bestScore, 98000);
    } else if (
      phoneModelNormalized.includes(searchKey)
    ) {
      bestScore = Math.max(bestScore, 96000);
    }

    /*
     * FUZZY ACTUAL MODEL
     */

    const modelDistance = levenshtein(
      searchKey,
      phoneModelNormalized
    );

    const allowedDistance =
      searchKey.length <= 3
        ? 1
        : searchKey.length <= 6
        ? 2
        : 3;

    if (modelDistance <= allowedDistance) {
      bestScore = Math.max(
        bestScore,
        50000 - modelDistance * 1000
      );
    }
  }

  /*
   * ----------------------------------------------------
   * 3. COMPATIBLE TEMPER MODEL SEARCH
   * ----------------------------------------------------
   */

  (phone.temperedGroups || []).forEach((item) => {
    const referenceModel = clean(
      item.reference_model
    );

    const referenceNormalized = normalize(
      item.reference_model
    );

    /*
     * BRAND SEARCH INSIDE COMPATIBLE MODEL
     */

    if (possibleBrand) {
      const referenceWords =
        referenceModel.split(" ");

      const referenceBrand =
        referenceWords.length > 0
          ? referenceWords[0]
          : "";

      const referenceBrandNormalized =
        normalize(referenceBrand);

      if (
        referenceBrandNormalized ===
        normalize(possibleBrand)
      ) {
        bestScore = Math.max(
          bestScore,
          115000
        );
      }

      if (
        referenceBrandNormalized.startsWith(
          normalize(query)
        )
      ) {
        bestScore = Math.max(
          bestScore,
          108000
        );
      }
    }

    /*
     * MODEL SEARCH
     */

    if (searchKey) {
      const compatibleKey =
        getModelKey(item.reference_model);

      if (!compatibleKey) return;

      if (compatibleKey === searchKey) {
        bestScore = Math.max(
          bestScore,
          99000
        );
      } else if (
        compatibleKey.startsWith(searchKey)
      ) {
        bestScore = Math.max(
          bestScore,
          97000
        );
      } else if (
        compatibleKey.includes(searchKey)
      ) {
        bestScore = Math.max(
          bestScore,
          95000
        );
      }

      /*
       * FUZZY COMPATIBLE MODEL
       */

      const compatibleDistance =
        levenshtein(
          searchKey,
          compatibleKey
        );

      const allowedDistance =
        searchKey.length <= 3
          ? 1
          : searchKey.length <= 6
          ? 2
          : 3;

      if (
        compatibleDistance <=
        allowedDistance
      ) {
        bestScore = Math.max(
          bestScore,
          49000 -
            compatibleDistance * 1000
        );
      }
    }

    /*
     * DIRECT TEXT MATCH
     *
     * Helps with one-word / partial searches.
     */

    if (
      queryNormalized.length >= 1 &&
      referenceNormalized.includes(
        queryNormalized
      )
    ) {
      bestScore = Math.max(
        bestScore,
        70000
      );
    }
  });

  /*
   * ----------------------------------------------------
   * 4. DIRECT BRAND TEXT MATCH
   * ----------------------------------------------------
   */

  if (
    queryNormalized.length >= 1 &&
    phoneBrandNormalized.startsWith(
      queryNormalized
    )
  ) {
    bestScore = Math.max(
      bestScore,
      105000
    );
  }

  /*
   * ----------------------------------------------------
   * 5. MODEL TEXT MATCH
   * ----------------------------------------------------
   */

  if (
    queryNormalized.length >= 1 &&
    phoneModelNormalized.includes(
      queryNormalized
    )
  ) {
    bestScore = Math.max(
      bestScore,
      75000
    );
  }

  return bestScore;
};

const getTemperSearchScore = (phone, query) => {
  if (!query.trim()) return 0;

  if (!phone.temperedGroups || phone.temperedGroups.length === 0) {
    return 0;
  }

  let bestScore = 0;

  phone.temperedGroups.forEach((item) => {
    const cleanModel = item.reference_model
      ?.replace(
        new RegExp(
          `^${phone.brand}\\s*`,
          "i"
        ),
        ""
      );

    if (!cleanModel) return;

    const score = getSearchScore(
      {
        model: cleanModel,
        brand: phone.brand,
      },
      query
    );

    bestScore = Math.max(bestScore, score);
  });

  return bestScore;
};

const filteredPhones = [...phones]
  .map((phone) => ({
    ...phone,
    searchScore: getSearchScore(phone, search),
  }))
  .filter((phone) => {
    if (!search.trim()) return true;
    return phone.searchScore > 0;
  })
  .sort((a, b) => {
    return b.searchScore - a.searchScore;
  });

const hasResults = filteredPhones.length > 0;

const temperedResults = [];

phones.forEach((phone) => {
  (phone.temperedGroups || []).forEach((item) => {
    const existing = temperedResults.find(
      (temper) => temper.group_id === item.group_id
    );

    if (existing) {
  // Add every unique fit quality
  if (!existing.fits.includes(item.fit)) {
    existing.fits.push(item.fit);
  }

  // Add every unique compatible phone
  if (
    !existing.compatiblePhones.some(
      (p) => p.id === phone.id
    )
  ) {
    existing.compatiblePhones.push({
      id: phone.id,
      model: phone.model,
      brand: phone.brand,
    });
  }
}
    else {
      temperedResults.push({
        group_id: item.group_id,
        reference_model: item.reference_model,
        fits: [item.fit],
        compatiblePhones: [
          {
            id: phone.id,
            model: phone.model,
            brand: phone.brand,
          },
        ],
      });
    }
  });
});
const filteredTempers = temperedResults
  .map((temper) => {
    let bestScore = 0;

    // Search the temper model itself
    const temperScore = getSearchScore(
      {
        model: temper.reference_model,
        brand: "",
        temperedGroups: [],
      },
      search
    );

    bestScore = Math.max(
      bestScore,
      temperScore
    );

    // Search all compatible phone models
    temper.compatiblePhones.forEach((phone) => {
      const phoneScore = getSearchScore(
        {
          model: phone.model,
          brand: phone.brand,
          temperedGroups: [],
        },
        search
      );

      bestScore = Math.max(
        bestScore,
        phoneScore
      );
    });

    return {
      ...temper,
      searchScore: bestScore,
    };
  })
  .filter((temper) => {
    if (!search.trim()) return true;

    return temper.searchScore > 0;
  })
  .sort((a, b) => {
    return b.searchScore - a.searchScore;
  });

const groupedTemperedGroups =
  selectedPhone?.temperedGroups?.reduce((groups, item) => {
    const cleanModel = item.reference_model
      ?.replace(
        new RegExp(
          `^${selectedPhone?.brand}\\s*`,
          "i"
        ),
        ""
      );

    const existing = groups.find(
      (group) => group.reference_model === cleanModel
    );

    if (existing) {
      if (!existing.fits.includes(item.fit)) {
        existing.fits.push(item.fit);
      }
    } else {
      groups.push({
        reference_model: cleanModel,
        fits: [item.fit],
      });
    }

    return groups;
  }, []) || [];


  /* LOADING SCREEN */

  if (loading) {

    return (

      <div className="h-screen bg-black flex items-center justify-center overflow-hidden relative">

        <div className="absolute w-[600px] h-[2px] bg-cyan-400 blur-sm top-1/2 animate-pulse"></div>

        <motion.div
        key={phoneImage || selectedPhone?.model}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >

          <div className="w-52 h-[420px] rounded-[55px] border border-gray-700 bg-gradient-to-b from-gray-900 to-black shadow-2xl relative overflow-hidden">

            <div className="absolute -left-40 top-0 w-40 h-full bg-white/10 rotate-12 blur-2xl animate-[shine_2.5s_linear_infinite]"></div>

          </div>

        </motion.div>

        <div className="absolute bottom-24 text-center">

          <h1 className="text-3xl md:text-6xl font-thin tracking-[4px] md:tracking-[10px] text-white">
            M.M TIMES & MOBILES
          </h1>

          <p className="text-gray-500 mt-6 tracking-[5px] text-sm">
            TEMPER • CASES • COMPATIBILITY
          </p>

        </div>

      </div>

    );
  }

  return (

    <div className="min-h-screen bg-black text-white p-4 md:p-6 overflow-x-hidden">

      {/* TITLE */}

      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-center mb-8"
      >
        📱 M.M TIMES & MOBILES
      </motion.h1>
      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3 }}
  className="text-center text-gray-400 text-lg md:text-2xl mb-10 tracking-wide"
>

  Best Fit Temper & Cases

</motion.p>

      {/* SEARCH */}

      <div className="flex justify-center mb-10">

  <div className="w-full max-w-xl">

    {/* SEARCH MODE */}

<div className="flex justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
      <button
        onClick={() => {
          setSearchMode("phones");
          setSearch("");
          setSubmitted(false);
        }}
        className={`px-4 sm:px-5 py-2 rounded-full font-semibold text-sm sm:text-base transition ${
          searchMode === "phones"
            ? "bg-cyan-400 text-black"
            : "bg-gray-900 text-gray-400 border border-gray-700 hover:border-cyan-400"
        }`}
      >
        📱 Phones
      </button>

      <button
        onClick={() => {
          setSearchMode("tempers");
          setSearch("");
          setSubmitted(false);
        }}
        className={`px-4 sm:px-5 py-2 rounded-full font-semibold text-sm sm:text-base transition ${
          searchMode === "tempers"
            ? "bg-green-400 text-black"
            : "bg-gray-900 text-gray-400 border border-gray-700 hover:border-green-400"
        }`}
      >
        🛡️ Temper Glass
      </button>

    </div>


    {/* SEARCH INPUT */}

    <input
      type="text"
      placeholder={
        searchMode === "phones"
          ? "Search phones, brands, models..."
          : "Search tempered glass models..."
      }
      value={search}

      onChange={(e) => {
        setSearch(e.target.value);
        setSubmitted(false);
      }}

      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setSubmitted(true);
        }
      }}

      className="w-full p-3 md:p-4 text-sm md:text-base rounded-2xl bg-gray-900 border border-gray-700 text-white outline-none focus:border-cyan-400 transition"
    />

  </div>

</div>

      {/* AUTOCOMPLETE */}

{search.length > 0 &&
  !submitted &&
  (
    searchMode === "phones"
      ? filteredPhones.length > 1
      : filteredTempers.length > 1
  ) && (
    <div className="max-w-xl mx-auto mb-6 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">

      {searchMode === "phones" ? (
        [
          ...new Map(
            filteredPhones.map((phone) => [
              phone.model,
              phone,
            ])
          ).values(),
        ]
          .slice(0, 5)
          .map((phone) => (
            <div
              key={phone.id}
              onClick={() => {
                setSearch(phone.model);
                setSubmitted(true);
              }}
              className="p-4 hover:bg-gray-800 cursor-pointer border-b border-gray-800 transition"
            >
              <p className="font-bold">
                {phone.model}
              </p>

              <p className="text-sm text-gray-400">
                {phone.brand}
              </p>
            </div>
          ))
      ) : (
        filteredTempers
          .slice(0, 5)
          .map((temper) => (
            <div
              key={temper.group_id}
              onClick={() => {
                setSearch(temper.reference_model);
                setSubmitted(true);
              }}
              className="p-4 hover:bg-gray-800 cursor-pointer border-b border-gray-800 transition"
            >
              <p className="font-bold text-green-400">
                <p className="font-bold text-green-400">
  🛡️ {(() => {
    const words = temper.reference_model
      .trim()
      .split(/\s+/);

    if (
      words.length >= 2 &&
      words[0].toLowerCase() ===
        words[1].toLowerCase()
    ) {
      return words.slice(1).join(" ");
    }

    return temper.reference_model;
  })()}
</p>
              </p>

              <p className="text-sm text-gray-400">
                {temper.compatiblePhones.length} compatible phones
              </p>
            </div>
          ))
      )}

    </div>
  )
}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 text-center">

          <h2 className="text-4xl font-bold text-cyan-400">
            {phones.length}+
          </h2>

          <p className="text-gray-400 mt-2">
  Supported Phone Models
</p>

        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 text-center">

          <h2 className="text-4xl font-bold text-green-400">
            {brands.length}
          </h2>

          <p className="text-gray-400 mt-2">
            Supported Brands
          </p>

        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 text-center">

          <h2 className="text-4xl font-bold text-pink-400">
            LIVE
          </h2>

          <p className="text-gray-400 mt-2">
            Real-Time Database
          </p>

        </div>

      </div>

      {/* BRAND BOXES */}

      {search.length === 0 && (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">

          {brands.map((brand) => (

            <motion.div
              key={brand}

              whileHover={{
                scale: 1.05,
              }}

              whileTap={{
                scale: 0.97,
              }}

              onClick={() => {
                setSearch(brand);
                setSubmitted(true);
              }}

              className="cursor-pointer p-6 rounded-3xl border text-center bg-gray-900 border-gray-700 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition"
            >

              <img
                src={brandIcons[brand]}
                alt={brand}
                className="w-14 h-14 mx-auto mb-4 object-contain"
              />

              <h2 className="text-2xl font-bold mb-2">
                {brand}
              </h2>

              <p className="text-gray-400">
                Explore Models
              </p>

            </motion.div>

          ))}

        </div>

      )}
      {search.length === 0 && (

  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center mb-10"
  >

    <h2 className="text-3xl md:text-5xl font-bold mb-3">
      🔥 Featured Devices
    </h2>

    <p className="text-gray-400 text-lg">
      Explore the most compatible premium models
    </p>

  </motion.div>

)}

      {/* RESULTS */}

<div className="grid gap-6 max-w-6xl mx-auto">

  {searchMode === "phones" ? (

    /* =====================================
       PHONE SEARCH RESULTS
       ===================================== */

    hasResults ? (

      filteredPhones.slice(0, 10).map((phone) => (

        <motion.div
          key={phone.id}

          initial={{
            opacity: 0,
            y: 40,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.4,
          }}

          onClick={() => {
  const fullPhone = phones.find(
    (p) => p.id === phone.id
  );
  setSelectedPhone(fullPhone || phone);
}}
          className="group bg-gradient-to-br from-gray-900 via-gray-900 to-black p-5 md:p-7 rounded-3xl border border-gray-700 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all duration-300 cursor-pointer"
        >

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">

            {/* PHONE IMAGE */}

<div className="w-full md:w-36 h-36 md:h-44 flex items-center justify-center shrink-0">
              {phone.image_url ? (

                <img
                  src={phone.image_url}
                  alt={phone.model}
                  className="max-h-40 max-w-32 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.35)] group-hover:scale-105 transition-transform duration-300"
                />

              ) : (

                <div className="text-6xl opacity-40">
                  📱
                </div>

              )}

            </div>


            {/* PHONE INFORMATION */}

            <div className="flex-1 w-full text-center md:text-left">

              {/* MODEL */}

              <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-cyan-400 transition">

                {phone.model}

              </h2>


              {/* BRAND */}

              <p className="text-gray-400 mb-5">

                <span className="text-gray-500">
                  Brand:
                </span>{" "}

                <span className="text-white font-semibold">
                  {phone.brand}
                </span>

              </p>


              {/* COMPATIBLE TEMPER */}

              <div className="mb-4">

                <p className="text-gray-500 text-sm mb-1">
                  Compatible Temper
                </p>

                {phone.temperedGroups &&
                phone.temperedGroups.length > 0 ? (

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">

                    {[
                      ...new Map(
                        phone.temperedGroups.map((item) => {

                          const cleanModel =
                            item.reference_model.replace(
                              new RegExp(
                                `^(${phone.brand})\\s+\\1\\s+`,
                                "i"
                              ),
                              "$1 "
                            );

                          return [
                            cleanModel,
                            cleanModel,
                          ];

                        })
                      ).values(),

                    ].map((model, index) => (

                      <button
  key={`${model}-${index}`}
  onClick={(e) => {
    e.stopPropagation();
    setSearchMode("tempers");
    setSearch(model);
    setSubmitted(true);
  }}
  className="px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 font-semibold text-sm hover:bg-green-400 hover:text-black transition-all cursor-pointer"
>
  {highlightModel(model, search)}
</button>

                    ))}

                  </div>

                ) : (

                  <span className="text-gray-500">
                    No compatible temper found
                  </span>

                )}

              </div>


              {/* FIT */}

              <div>

                <p className="text-gray-500 text-sm mb-1">
                  Fit Quality
                </p>

                {phone.temperedGroups &&
                phone.temperedGroups.length > 0 ? (

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">

                    {[
                      ...new Set(
                        phone.temperedGroups.map(
                          (item) => item.fit
                        )
                      ),

                    ].map((fit, index) => (

                      <span
                        key={`${fit}-${index}`}
                        className="px-3 py-1.5 rounded-full bg-pink-400/10 border border-pink-400/20 text-pink-400 font-bold text-sm"
                      >

                        {fit}

                      </span>

                    ))}

                  </div>

                ) : (

                  <span className="text-gray-500">
                    —
                  </span>

                )}

              </div>

            </div>


            {/* VIEW DETAILS */}

            <div className="shrink-0">

              <div className="px-5 py-3 rounded-2xl border border-cyan-400/30 text-cyan-400 font-semibold group-hover:bg-cyan-400 group-hover:text-black transition-all">

                View Details →

              </div>

            </div>

          </div>

        </motion.div>

      ))

    ) : (

      <div className="text-center mt-20">

        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          😭 No Models Found
        </h2>

        <p className="text-gray-400 text-xl">
          Bro searched a secret phone 💀
        </p>

      </div>

    )

  ) : (

    /* =====================================
       TEMPER GLASS SEARCH RESULTS
       ===================================== */

    filteredTempers.length > 0 ? (

      filteredTempers
        .slice(0, 10)
        .map((temper) => (

          <motion.div
            key={temper.group_id}
            

            initial={{
              opacity: 0,
              y: 40,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.4,
            }}
            onClick={() => {
  setExpandedTemper(
    expandedTemper === temper.group_id
      ? null
      : temper.group_id
  );  
}}

          className="group bg-gradient-to-br from-gray-900 via-gray-900 to-black p-5 md:p-8 rounded-3xl border border-gray-700 hover:border-green-400 hover:shadow-[0_0_30px_rgba(74,222,128,0.25)] transition-all duration-300"
> 
            {/* TEMPER MODEL */}

<div className="flex flex-col md:flex-row gap-4 md:gap-6">  
              <div className="w-full md:w-32 h-32 flex items-center justify-center shrink-0">

                <div className="text-6xl">
                  🛡️
                </div>

              </div>


              <div className="flex-1">

                <p className="text-gray-500 text-sm mb-1">
                  Temper Glass Model
                </p>

                <h2 className="text-2xl md:text-3xl font-bold text-green-400 mb-5">

                  {(() => {
  const words = temper.reference_model
    .trim()
    .split(/\s+/);

  if (
    words.length >= 2 &&
    words[0].toLowerCase() ===
      words[1].toLowerCase()
  ) {
    return words.slice(1).join(" ");
  }

  return temper.reference_model;
})()}

                </h2>


                {/* FIT */}

                <div className="mb-5">

                  <p className="text-gray-500 text-sm mb-2">
                    Fit Quality
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {[...new Set(temper.fits)].map(
                      (fit, index) => (

                        <span
                          key={`${fit}-${index}`}
                          className="px-3 py-1.5 rounded-full bg-pink-400/10 border border-pink-400/20 text-pink-400 font-bold text-sm"
                        >
                          {fit}
                        </span>

                      )
                    )}

                  </div>

                </div>


                {/* COMPATIBLE PHONES */}

                <div>

                  <p className="text-gray-500 text-sm mb-2">
                    Compatible Phones
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {[...temper.compatiblePhones]
  .sort((a, b) => {
    const query = normalizeSearch(search);

    const aModel = normalizeSearch(a.model);
    const bModel = normalizeSearch(b.model);

    const aMatch =
      aModel === query ||
      aModel.includes(query);

    const bMatch =
      bModel === query ||
      bModel.includes(query);

    if (aMatch && !bMatch) return -1;
    if (bMatch && !aMatch) return 1;

    return 0;
  })
  .slice(
  0,
  expandedTemper === temper.group_id
    ? temper.compatiblePhones.length
    : 15
)
.map((phone) => (

   <button
  key={phone.id}
  onClick={(e) => {
    e.stopPropagation();
    const fullPhone = phones.find(
      (p) => p.id === phone.id
    );

    if (fullPhone) {
      setSelectedPhone(fullPhone);
    }
  }}
  className="px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-semibold text-sm hover:bg-cyan-400 hover:text-black transition-all cursor-pointer"
>
  {phone.model}
</button>

                      ))}
                      {temper.compatiblePhones.length > 15 && (
  <div className="mt-4 text-center">
    <span className="text-green-400 text-sm font-semibold">
      {expandedTemper === temper.group_id
        ? "Show Less ↑"
        : `Show All ${temper.compatiblePhones.length} Compatible Phones ↓`}
    </span>
  </div>
)}

                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        ))

    ) : (

      <div className="text-center mt-20">

        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          😭 No Temper Found
        </h2>

        <p className="text-gray-400 text-xl">
          Try another phone model 💀
        </p>

      </div>

    )

  )}

</div>

      {/* POPUP */}

{selectedPhone && (

  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4 overflow-y-auto">

    <motion.div

      initial={{
        opacity: 0,
        scale: 0.7,
        y: 100,
      }}

      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}

      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}

      className="relative bg-gradient-to-b from-gray-900 to-black border border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.25)] rounded-[35px] p-6 md:p-10 w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto"
    >

      {/* GLOW */}

      <div className="absolute -top-32 -right-32 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full"></div>

      {/* CLOSE */}

      <button
        onClick={() => setSelectedPhone(null)}
        className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 hover:bg-red-500 transition text-white text-2xl z-20"
      >
        ✕
      </button>

      <div className="relative z-10">

        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* LEFT SIDE IMAGE */}

<div className="flex justify-center items-center w-full md:w-1/2 min-h-[200px] md:min-h-[300px]">

  <motion.div
    key={phoneImage || selectedPhone?.model}
    initial={{
      scale: 0.2,
      rotateY: 90,
      rotateZ: 15,
      x: 200,
      opacity: 0,
    }}
    animate={{
      scale: 1,
      rotateY: 0,
      rotateZ: 0,
      x: 0,
      opacity: 1,
    }}
    transition={{
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
    }}
    className="relative flex justify-center items-center"
    style={{
      transformStyle: "preserve-3d",
    }}
  >

    <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full"></div>

<div className="relative z-10 max-h-[300px] md:max-h-[420px] flex items-center justify-center">
      {imageLoading ? (
  <div className="flex flex-col items-center justify-center min-h-[300px]">
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "linear",
      }}
      className="w-14 h-14 rounded-full border-4 border-gray-700 border-t-cyan-400"
    />

    <p className="text-gray-400 mt-5 text-sm">
      Loading phone image...
    </p>
  </div>
) : phoneImage ? (
  <img
    src={phoneImage}
    alt={selectedPhone?.model}
    className="max-h-[420px] w-auto h-auto object-contain drop-shadow-[0_0_45px_rgba(34,211,238,0.8)]"
  />
) : (
  <div className="flex flex-col items-center justify-center min-h-[300px]">
    <div className="text-6xl mb-4">
      📱
    </div>

    <p className="text-gray-500 text-lg text-center">
      Image coming soon
    </p>
  </div>
)}

    </div>

  </motion.div>

</div>
        
{/* RIGHT SIDE DETAILS */}

          {/* COMPATIBILITY DETAILS */}

<div className="bg-white/5 border border-white/10 rounded-3xl p-6">

  {/* PHONE MODEL */}

  <div>
    <p className="text-gray-400 text-sm mb-1">
      Phone Model
    </p>

    <h3 className="text-2xl font-bold text-cyan-400">
      {selectedPhone?.model}
    </h3>
  </div>


  {/* COMPATIBLE TEMPER */}

  {selectedPhone?.temperedGroups &&
  selectedPhone.temperedGroups.length > 0 ? (

    <div className="mt-6 space-y-4">

{groupedTemperedGroups.map((item, index) => (
        <div
          key={`${item.group_id}-${item.reference_model}-${item.fit}-${index}`}
          className="border border-white/10 rounded-2xl p-4"
        >

          <p className="text-gray-400 text-sm mb-1">
            Compatible Temper
          </p>

          <h3 className="text-2xl font-bold text-green-400">
  {item.reference_model}
</h3>


          {/* FIT QUALITY */}

          <div className="mt-4">

            <p className="text-gray-400 text-sm mb-1">
              Fit Quality
            </p>

            <span className="text-lg font-bold text-pink-400">
  {item.fits.join(", ")}
</span>

          </div>

        </div>

      ))}

    </div>

  ) : (

    <p className="text-gray-500 mt-4">
      No compatible temper found
    </p>

  )}
  
  {/* AVAILABLE PRODUCTS */}

{selectedPhone?.compatibleProducts &&
selectedPhone.compatibleProducts.length > 0 && (
  <div className="mt-8">

    <p className="text-gray-400 text-sm mb-3">
      Available Products
    </p>

    <div className="space-y-3">

      {selectedPhone.compatibleProducts.map((product) => (
        <div
          key={product.id}
          className="border border-white/10 rounded-2xl p-4 bg-white/5"
        >

          <div className="flex justify-between items-start gap-4">

            <div>
              <h3 className="text-lg font-bold text-cyan-400">
                {product.product_name}
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                {product.category}
              </p>
            </div>

            <div className="text-right">
              {product.sale_price ? (
                <>
                  <p className="text-gray-500 line-through text-sm">
                    ₹{product.price}
                  </p>

                  <p className="text-green-400 font-bold text-lg">
                    ₹{product.sale_price}
                  </p>
                </>
              ) : (
                <p className="text-green-400 font-bold text-lg">
                  ₹{product.price}
                </p>
              )}
            </div>

          </div>

          <p className="text-gray-400 text-sm mt-3">
            {product.stock > 0
              ? `In Stock • ${product.stock} available`
              : "Out of Stock"}
          </p>

        </div>
      ))}

    </div>

  </div>
)}

</div>


</div>
        {/* BUTTONS */}

        <div className="flex flex-col md:flex-row gap-4 mt-8">

          <button className="flex-1 py-4 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-105 transition">

            Compatible ✅

          </button>

          <button
            onClick={() => setSelectedPhone(null)}
            className="flex-1 py-4 rounded-2xl border border-white/20 hover:bg-white/10 transition"
          >

            Close

          </button>

        </div>

      </div>

    </motion.div>

  </div>
  

)}
<footer className="mt-20 border-t border-gray-800 pt-10 pb-6 text-center">

  <h2 className="text-2xl font-bold text-cyan-400 mb-3">
    M.M TIMES & MOBILES
  </h2>

  <p className="text-gray-400 mb-4">
    Smart Compatibility Checker for Temper Glass & Back Cases
  </p>

  <div className="flex justify-center gap-6 text-gray-500 text-sm flex-wrap">

    <p>📱 Premium Devices</p>

    <p>🛡 Temper Protection</p>

    <p>✨ Perfect Fit Cases</p>

  </div>

  <p className="text-gray-600 text-sm mt-6">
    © 2026 M.M TIMES. All rights reserved.
  </p>

</footer>
    </div>
  );
}
