import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import axios from 'axios';

const Dashboard = () => {
  const navigation = useNavigation();
  const [currentUnit, setCurrentUnit] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [helpDeskPersonal, setHelpDeskPersonal] = useState(0);
  const [helpDeskCommunity, setHelpDeskCommunity] = useState(0);
  const [ticketModal, setTicketModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ type: 'Personal', subject: '', description: '' });
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  
  // Add this new state
  const [helpDeskTickets, setHelpDeskTickets] = useState<any[]>([]);
  const [loadingHelpDesk, setLoadingHelpDesk] = useState(false);
  const [helpDeskError, setHelpDeskError] = useState<string | null>(null);
  
  // Unit dropdown states
  type UnitOption = { id: number; name: string };
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUnitId, setCurrentUnitId] = useState<number | null>(null);
  
  // ADD: Loading state for initial data fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Space Details Data - fetched from API per selected unit
  const [unitDetails, setUnitDetails] = useState({
    block: '',
    floor: '',
    builtArea: '',
    carpetArea: ''
  });
  
  // Debug effect: logs whenever unitDetails changes
  useEffect(() => {
    console.log('unitDetails changed (UI state):', unitDetails);
  }, [unitDetails]);
  
  // Owner Details Data - will be fetched from API
  const [ownerDetails, setOwnerDetails] = useState({
    name: '',
    phone: '',
    email: ''
  });
  
  // Occupant Details Data - will be fetched from API
  const [occupantDetails, setOccupantDetails] = useState({
    name: '',
    phone: '',
    email: '',
    tenant: false
  });
  
  // Recent Visitor Data - UPDATED to be fetched from API
  const [recentVisitor, setRecentVisitor] = useState({
    name: '',
    phone: '',
    checkout: '',
    checkin: '',
    purpose: '',
    whomToMeet: ''
  });
  const [loadingVisitor, setLoadingVisitor] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  // NEW: Announcement/Notice Data - fetched from API
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  
  // NEW: State for tracking expanded announcements
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<{[key: string]: boolean}>({});

  // FIXED: Comprehensive date formatting function with better error handling and validation
  const formatDateTime = useCallback((dateString: string | null | undefined, timeString?: string | null | undefined) => {
    // Handle null, undefined, empty, or invalid input
    if (!dateString || 
        dateString === 'NULL' || 
        dateString === 'null' || 
        dateString === '' || 
        dateString === '0000-00-00' ||
        dateString === '1900-01-01' ||
        dateString === '0001-01-01') {
      return '';
    }
    
    try {
      // Clean and normalize the date string
      let cleanDateString = String(dateString).trim();
      
      // Remove common problematic characters and normalize
      cleanDateString = cleanDateString
        .replace(/T00:00:00\.000Z?$/i, '') // Remove T00:00:00.000Z
        .replace(/T00:00:00Z?$/i, '') // Remove T00:00:00Z
        .replace(/\s+00:00:00$/, '') // Remove trailing 00:00:00
        .replace(/Z$/i, '') // Remove trailing Z
        .replace(/\+00:?00$/i, '') // Remove +0000 or +00:00
        .trim();

      let parsedDate: Date | null = null;

      // Try different parsing strategies
      const parsingStrategies = [
        // 1. ISO 8601 format with proper timezone handling
        () => {
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleanDateString)) {
            // For ISO format, ensure it has proper Z suffix for UTC
            let isoString = cleanDateString;
            if (!isoString.includes('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
              isoString += 'Z';
            }
            return new Date(isoString);
          }
          return null;
        },

        // 2. YYYY-MM-DD format
        () => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
            const [year, month, day] = cleanDateString.split('-').map(Number);
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return new Date(year, month - 1, day); // month is 0-indexed
            }
          }
          return null;
        },

        // 3. DD/MM/YYYY or MM/DD/YYYY format
        () => {
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDateString)) {
            const parts = cleanDateString.split('/').map(Number);
            if (parts.length === 3) {
              const [first, second, year] = parts;
              
              // Try DD/MM/YYYY first (more common internationally)
              if (first <= 31 && second <= 12 && year >= 1900 && year <= 2100) {
                const testDate = new Date(year, second - 1, first);
                if (testDate.getFullYear() === year && 
                    testDate.getMonth() === second - 1 && 
                    testDate.getDate() === first) {
                  return testDate;
                }
              }
              
              // Try MM/DD/YYYY if DD/MM/YYYY failed
              if (first <= 12 && second <= 31 && year >= 1900 && year <= 2100) {
                const testDate = new Date(year, first - 1, second);
                if (testDate.getFullYear() === year && 
                    testDate.getMonth() === first - 1 && 
                    testDate.getDate() === second) {
                  return testDate;
                }
              }
            }
          }
          return null;
        },

        // 4. DD-MM-YYYY format
        () => {
          if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDateString)) {
            const [day, month, year] = cleanDateString.split('-').map(Number);
            if (day <= 31 && month <= 12 && year >= 1900 && year <= 2100) {
              const testDate = new Date(year, month - 1, day);
              if (testDate.getFullYear() === year && 
                  testDate.getMonth() === month - 1 && 
                  testDate.getDate() === day) {
                return testDate;
              }
            }
          }
          return null;
        },

        // 5. YYYYMMDD format
        () => {
          if (/^\d{8}$/.test(cleanDateString)) {
            const year = parseInt(cleanDateString.substring(0, 4));
            const month = parseInt(cleanDateString.substring(4, 6));
            const day = parseInt(cleanDateString.substring(6, 8));
            
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              const testDate = new Date(year, month - 1, day);
              if (testDate.getFullYear() === year && 
                  testDate.getMonth() === month - 1 && 
                  testDate.getDate() === day) {
                return testDate;
              }
            }
          }
          return null;
        },

        // 6. Last resort - try native Date parsing
        () => {
          try {
            const nativeDate = new Date(cleanDateString);
            // Check if it's a valid date and not in the past century (likely invalid)
            if (!isNaN(nativeDate.getTime()) && nativeDate.getFullYear() > 1900) {
              return nativeDate;
            }
          } catch (e) {
            // Ignore errors and continue
          }
          return null;
        }
      ];

      // Try each strategy until one succeeds
      for (const strategy of parsingStrategies) {
        try {
          const result = strategy();
          if (result && !isNaN(result.getTime()) && result.getFullYear() > 1900) {
            parsedDate = result;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // If no date could be parsed, return empty string
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        console.warn(`Could not parse date: "${dateString}"`);
        return '';
      }

      // Add time if provided and valid
      if (timeString && 
          timeString !== 'NULL' && 
          timeString !== 'null' && 
          timeString !== '' &&
          typeof timeString === 'string') {
        try {
          const cleanTime = timeString.trim();
          const timeParts = cleanTime.split(':');
          
          if (timeParts.length >= 2) {
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            const second = timeParts.length >= 3 ? parseInt(timeParts[2]) : 0;
            
            // Validate time components
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
              parsedDate.setHours(hour, minute, second);
            }
          }
        } catch (timeError) {
          console.warn(`Error parsing time: ${timeString}`, timeError);
        }
      }

      // Format the date for display
      const formatOptions: Intl.DateTimeFormatOptions = timeString && timeString !== 'NULL' && timeString !== 'null' && timeString !== '' ? {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      } : {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      };

      return parsedDate.toLocaleDateString('en-US', formatOptions);
      
    } catch (error) {
      console.error(`Date formatting error for "${dateString}":`, error);
      return '';
    }
  }, []);

  // FIXED: Parse and get date for sorting (returns Date object or null)
  const parseDate = useCallback((dateString: string | null | undefined): Date | null => {
    if (!dateString || 
        dateString === 'NULL' || 
        dateString === 'null' || 
        dateString === '' || 
        dateString === '0000-00-00' ||
        dateString === '1900-01-01' ||
        dateString === '0001-01-01') {
      return null;
    }

    try {
      let cleanDateString = String(dateString).trim()
        .replace(/T00:00:00\.000Z?$/i, '')
        .replace(/T00:00:00Z?$/i, '')
        .replace(/\s+00:00:00$/, '')
        .replace(/Z$/i, '')
        .replace(/\+00:?00$/i, '')
        .trim();

      // Try ISO format first
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleanDateString)) {
        let isoString = cleanDateString;
        if (!isoString.includes('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
          isoString += 'Z';
        }
        const date = new Date(isoString);
        return !isNaN(date.getTime()) ? date : null;
      }

      // Try YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
        const [year, month, day] = cleanDateString.split('-').map(Number);
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          return !isNaN(date.getTime()) ? date : null;
        }
      }

      // Try native Date parsing as last resort
      const nativeDate = new Date(cleanDateString);
      if (!isNaN(nativeDate.getTime()) && nativeDate.getFullYear() > 1900) {
        return nativeDate;
      }

      return null;
    } catch (error) {
      console.error(`Error parsing date for sorting: "${dateString}"`, error);
      return null;
    }
  }, []);

  // FIXED: Define fetchUnitsFromAPI with proper error handling and state management
  const fetchUnitsFromAPI = useCallback(async (signal?: AbortSignal) => {
    try {
      console.log("Fetching units...");
      setIsLoadingUnits(true);
      setUnitsError(null);
      
      const valuesString = "@p_Unit_Id=280,@p_Society_Id=NULL,@p_Block_Id=NULL,@p_Floor=NULL,@p_Society_GUID=NULL,@p_Unit_Type_Id=NULL,@p_Unit_Name=NULL,@p_Builtup_Area=NULL,@p_Carpet_Area=NULL,@p_Super_Built_Area=NULL,@p_Number_Of_Room=NULL,@p_Number_Of_Bathroom=NULL,@p_Number_Of_Balcony=NULL,@p_Contact_Number=NULL,@p_Current_Occupancy_Type_Id=NULL,@p_Unit_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_First_Name=NULL,@p_Is_Primary=NULL,@p_Email=NULL";
      
      const formBody = new URLSearchParams({
        AuthKey: "86A264E4-ECF8-4627-AF83-5512FE83DAE6",
        HostKey: "8ECB211D2",
        Object: "UNM_SP_Unit_Get",
        Values: valuesString,
      }).toString();
      
      const API_URL = "https://applianceservicemgmt.dev2stage.in/api/rest/Invoke";
      
      const response = await axios.post(API_URL, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
        timeout: 15000, // Add timeout
      });

      const topLevel = response?.data ?? {};
      console.log("Response Data keys:", Object.keys(topLevel));
      
      let rawArray: any = null;
      if (Array.isArray(topLevel)) {
        rawArray = topLevel;
      } else if (Array.isArray((topLevel as any)?.data)) {
        rawArray = (topLevel as any).data;
      } else if (Array.isArray((topLevel as any)?.Data)) {
        rawArray = (topLevel as any).Data;
      } else if (Array.isArray((topLevel as any)?.result)) {
        rawArray = (topLevel as any).result;
      } else if (Array.isArray((topLevel as any)?.Result)) {
        rawArray = (topLevel as any).Result;
      } else if (Array.isArray((topLevel as any)?.records)) {
        rawArray = (topLevel as any).records;
      } else if (Array.isArray((topLevel as any)?.Records)) {
        rawArray = (topLevel as any).Records;
      } else if ((topLevel as any)?.data && typeof (topLevel as any).data === 'object') {
        const maybeArrayKey = Object.keys((topLevel as any).data).find(
          (k) => Array.isArray((topLevel as any).data[k])
        );
        if (maybeArrayKey) rawArray = (topLevel as any).data[maybeArrayKey];
      }

      if (!Array.isArray(rawArray)) {
        console.warn("Could not locate units array in response. Sample:", topLevel);
        setUnits([]);
        setCurrentUnit("");
        setCurrentUnitId(null);
        setUnitsError('No units found');
        return;
      }

      console.log("Units-like array length:", rawArray.length);
      
      // Map to options with ID and name (strictly typed as UnitOption[])
      const options: UnitOption[] = rawArray.reduce<UnitOption[]>((acc, u: any) => {
        const id = Number(
          u?.Unit_Id ?? u?.unitId ?? u?.unit_id ?? u?.Id ?? u?.UNIT_ID
        );
        const name =
          u?.Unit_Name ?? u?.unitName ?? u?.unit_name ?? u?.name ?? u?.Unit;
        if (!id || typeof name !== 'string') return acc;
        const trimmed = String(name).trim();
        if (!trimmed) return acc;
        acc.push({ id, name: trimmed });
        return acc;
      }, []);

      console.log("Mapped Unit Options:", options);
      setUnits(options);
      
      // FIXED: Properly set the first unit and trigger dependent data fetching
      if (options.length > 0) {
        const firstUnit = options[0];
        setCurrentUnit(firstUnit.name);
        setCurrentUnitId(firstUnit.id);
        
        // IMPORTANT: Return the first unit ID for immediate use
        return firstUnit.id;
      } else {
        setCurrentUnit("");
        setCurrentUnitId(null);
        setUnitsError('No units available');
        return null;
      }
    } catch (error: any) {
      if (error?.code === 'ERR_CANCELED') {
        console.log('Request canceled');
        return null;
      }
      console.error("Error fetching units:", error?.message || error);
      setUnits([]);
      setCurrentUnit("");
      setCurrentUnitId(null);
      setUnitsError('Failed to load units');
      return null;
    } finally {
      setIsLoadingUnits(false);
    }
  }, []);

  // Fetch detailed info for a selected unit
  const fetchUnitDetails = useCallback(async (unitId: number, signal?: AbortSignal) => {
    try {
      if (unitId == null) return; // allow id=0
      console.log('Fetching unit details for', unitId);
      
      const valuesString = `@p_Unit_Id=${unitId},@p_Society_Id=NULL,@p_Block_Id=NULL,@p_Floor=NULL,@p_Society_GUID=NULL,@p_Unit_Type_Id=NULL,@p_Unit_Name=NULL,@p_Builtup_Area=NULL,@p_Carpet_Area=NULL,@p_Super_Built_Area=NULL,@p_Number_Of_Room=NULL,@p_Number_Of_Bathroom=NULL,@p_Number_Of_Balcony=NULL,@p_Contact_Number=NULL,@p_Current_Occupancy_Type_Id=NULL,@p_Unit_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=1,@p_First_Name=NULL,@p_Is_Primary=NULL,@p_Email=NULL`;
      
      const formBody = new URLSearchParams({
        AuthKey: "86A264E4-ECF8-4627-AF83-5512FE83DAE6",
        HostKey: "8ECB211D2",
        Object: "UNM_SP_Unit_Get",
        Values: valuesString,
      }).toString();
      
      const API_URL = "https://applianceservicemgmt.dev2stage.in/api/rest/Invoke";
      
      const response = await axios.post(API_URL, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
        timeout: 15000, // Add timeout
      });

      console.log('Unit details response:', response.data);
      const data = response?.data;
      let arr: any[] | null = null;
      
      // Check for Data key first (capital D) as per your API response
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data?.Data)) arr = data.Data;
      else if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data?.result)) arr = data.result;
      else if (Array.isArray(data?.Result)) arr = data.Result;
      else if (Array.isArray(data?.records)) arr = data.records;
      else if (Array.isArray(data?.Records)) arr = data.Records;
      else if (data?.data && typeof data.data === 'object') {
        const key = Object.keys(data.data).find((k) => Array.isArray(data.data[k]));
        if (key) arr = data.data[key];
      }

      console.log('Parsed unit details array:', arr);
      const detail = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
      if (!detail) {
        console.warn('No unit details found in response');
        return;
      }

      console.log('Unit detail object:', detail);
      
      // Fixed field mapping based on your API response structure
      const unitMapped = {
        block: detail?.BLOKUNIT_Block_Code || 'N/A',
        floor: detail?.Floor ? String(detail.Floor) : 'N/A',
        builtArea: detail?.Builtup_Area ? String(detail.Builtup_Area) : 'N/A',
        carpetArea: detail?.Carpet_Area ? String(detail.Carpet_Area) : 'N/A',
      };

      // Map owner details from the API response
      const ownerMapped = {
        name: detail?.Owner_FirstName && detail?.Owner_LastName 
          ? `${detail.Owner_FirstName} ${detail.Owner_LastName}`.trim()
          : detail?.Owner_FirstName || 'No owner information',
        phone: detail?.Owner_Mobile_Number || '',
        email: detail?.Owner_Email || '',
      };

      // Map occupant details from the API response  
      const occupantMapped = {
        name: detail?.Occupant_FirstName && detail?.Occupant_LastName
          ? `${detail.Occupant_FirstName} ${detail.Occupant_LastName}`.trim()
          : detail?.Occupant_FirstName || 'No occupant information',
        phone: detail?.Occupant_MobileNo || '',
        email: detail?.Occupant_Email || '',
        tenant: Boolean(detail?.Occupant_FirstName), // If occupant exists, assume they might be tenant
      };
      
      console.log('Mapped unit details:', unitMapped);
      console.log('Mapped owner details:', ownerMapped);
      console.log('Mapped occupant details:', occupantMapped);
      
      // Update all states with the mapped data
      setUnitDetails(unitMapped);
      setOwnerDetails(ownerMapped);
      setOccupantDetails(occupantMapped);
      
    } catch (e: any) {
      if (e?.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch unit details', e);
      }
    }
  }, []);

  // NEW: Fetch recent visitor data for the selected unit
  const fetchRecentVisitor = useCallback(async (unitId: number | null, signal?: AbortSignal) => {
    try {
      setLoadingVisitor(true);
      setVisitorError(null);
      
      // Don't call API if no unit ID
      if (!unitId) {
        setRecentVisitor({
          name: '',
          phone: '',
          checkout: '',
          checkin: '',
          purpose: '',
          whomToMeet: ''
        });
        setLoadingVisitor(false);
        return;
      }
      
      // Filter by current unit ID and get recent visitors
      const valuesString = `@p_Visitor_Id=NULL,@p_Society_Id=NULL,@p_Unit_Id=${unitId},@p_Unit_Name=NULL,@p_Visitor_Name=NULL,@p_Visitor_Mobile_No=NULL,@p_Visitor_Email=NULL,@p_Visitor_Pass_No=NULL,@p_Vehicle_Registraion_No=NULL,@p_Visitor_Address=NULL,@p_Visitor_City=NULL,@p_Visitor_State=NULL,@p_Visitor_Country=NULL,@p_Whom_To_Meet_Id=NULL,@p_Whom_To_Meet_Name=NULL,@p_Visiting_Purpose=NULL,@p_Vehicle_Type=NULL,@p_Vehicle_Type_Name=NULL,@p_Make_Model=NULL,@p_Office_Security_Staff_Id=NULL,@p_Security_Personal_Name=NULL,@p_From_Checkin_Date=NULL,@p_To_Checkin_Date=NULL,@p_Checkin_Time=NULL,@p_From_Checkout_Date=NULL,@p_To_Checkout_Date=NULL,@p_Checkout_Time=NULL,@p_Pin_Code=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Visitor_Photo=NULL`;
      
      const formBody = new URLSearchParams({
        AuthKey: "86A264E4-ECF8-4627-AF83-5512FE83DAE6",
        HostKey: "8ECB211D2",
        Object: "VIM_SP_Visitor_Get",
        Values: valuesString,
      }).toString();
      
      const API_URL = "https://applianceservicemgmt.dev2stage.in/api/rest/Invoke";
      
      console.log(`Fetching recent visitors for unit ID: ${unitId}`);
      
      const response = await axios.post(API_URL, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
        timeout: 15000, // 15 second timeout
      });

      console.log("Visitor raw response:", response.data);
      let arr: any[] | null = null;
      if (Array.isArray(response.data)) arr = response.data;
      else if (Array.isArray(response.data?.Data)) arr = response.data.Data;
      else if (Array.isArray(response.data?.data)) arr = response.data.data;
      else if (Array.isArray(response.data?.Result)) arr = response.data.Result;

      if (!arr || arr.length === 0) {
        setRecentVisitor({
          name: '',
          phone: '',
          checkout: '',
          checkin: '',
          purpose: '',
          whomToMeet: ''
        });
        console.log(`No visitors found for unit ID: ${unitId}`);
        return;
      }

      // FIXED: Sort by checkin date/time to get the most recent visitor using parseDate
      const sortedVisitors = arr.sort((a, b) => {
        const dateA = parseDate(a?.Checkin_Date || a?.createdDate);
        const dateB = parseDate(b?.Checkin_Date || b?.createdDate);
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });

      const mostRecentVisitor = sortedVisitors[0];

      // Map visitor data with improved date formatting
      const visitorMapped = {
        name: mostRecentVisitor?.Visitor_Name || 'No recent visitors',
        phone: mostRecentVisitor?.Visitor_Mobile_No || '',
        checkout: mostRecentVisitor?.Checkout_Date 
          ? formatDateTime(mostRecentVisitor.Checkout_Date, mostRecentVisitor?.Checkout_Time)
          : '',
        checkin: mostRecentVisitor?.Checkin_Date 
          ? formatDateTime(mostRecentVisitor.Checkin_Date, mostRecentVisitor?.Checkin_Time)
          : '',
        purpose: mostRecentVisitor?.Visiting_Purpose || '',
        whomToMeet: mostRecentVisitor?.Whom_To_Meet_Name || ''
      };
      
      console.log('Mapped recent visitor:', visitorMapped);
      setRecentVisitor(visitorMapped);
      
    } catch (err: any) {
      if (err?.code !== "ERR_CANCELED") {
        console.error("Visitor API error:", err.message || err);
        setVisitorError("Failed to load visitor information");
        
        // Set default values on error
        setRecentVisitor({
          name: '',
          phone: '',
          checkout: '',
          checkin: '',
          purpose: '',
          whomToMeet: ''
        });
      }
    } finally {
      setLoadingVisitor(false);
    }
  }, [formatDateTime, parseDate]);

  // Helper function to strip HTML tags
  const stripHtmlTags = (htmlString: string | null | undefined) => {
    if (!htmlString) return '';
    
    return htmlString
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing spaces
  };

  // NEW: Function to toggle announcement expansion
  const toggleAnnouncementExpansion = useCallback((announcementId: string) => {
    setExpandedAnnouncements(prev => ({
      ...prev,
      [announcementId]: !prev[announcementId]
    }));
  }, []);

  // NEW: Function to truncate text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // FIXED: Updated API call function with proper sorting - most recent first
  const fetchAnnouncements = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadingAnnouncements(true);
      setAnnouncementError(null);
      
      // Use the Notice API parameters you provided
      const valuesString = "@p_Notice_Id=NULL,@p_Society_Id=NULL,@p_Template_Id=NULL,@p_Reply_To_Email=NULL,@p_From_Expiry_Date=NULL,@p_To_Expiry_Date=NULL,@p_Include_Managers=NULL,@p_From_Publish_Date=NULL,@p_To_Publish_Date=NULL,@p_Brief_Description=NULL,@p_Detail_Descrption=NULL,@p_Notice_Recepient_Type=NULL,@p_Notice_Status_Id=NULL,@p_Is_Sms=NULL,@p_Is_Email=NULL,@p_Is_Whatsapp=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Pause=NULL,@p_Resume=NULL";
      
      const formBody = new URLSearchParams({
        AuthKey: "86A264E4-ECF8-4627-AF83-5512FE83DAE6",
        HostKey: "8ECB211D2",
        Object: "NOM_SP_Notice_Get",
        Values: valuesString,
      }).toString();
      
      const API_URL = "https://applianceservicemgmt.dev2stage.in/api/rest/Invoke";
      
      console.log("Fetching announcements/notices...");
      
      const response = await axios.post(API_URL, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
        timeout: 15000,
      });

      console.log("Announcements raw response:", response.data);
      let arr: any[] | null = null;
      if (Array.isArray(response.data)) arr = response.data;
      else if (Array.isArray(response.data?.Data)) arr = response.data.Data;
      else if (Array.isArray(response.data?.data)) arr = response.data.data;
      else if (Array.isArray(response.data?.Result)) arr = response.data.Result;

      if (!arr || arr.length === 0) {
        setAnnouncements([]);
        console.log("No announcements found");
        return;
      }

      // Clean HTML tags from the data before processing
      const cleanedAnnouncements = arr.map((announcement) => ({
        ...announcement,
        Brief_Description: stripHtmlTags(announcement?.Brief_Description),
        Detail_Descrption: stripHtmlTags(announcement?.Detail_Descrption),
        Title: stripHtmlTags(announcement?.Title),
      }));

      // FIXED: Sort by publish date to get the most recent announcements first using parseDate
      const sortedAnnouncements = cleanedAnnouncements.sort((a, b) => {
        // Try multiple date fields for sorting - most recent first
        const dateA = parseDate(a?.Publish_Date) || 
                    parseDate(a?.Created_Date) || 
                    parseDate(a?.CreatedDate) ||
                    parseDate(a?.Date) ||
                    new Date(0); // Fallback to epoch if no date found
                    
        const dateB = parseDate(b?.Publish_Date) || 
                    parseDate(b?.Created_Date) || 
                    parseDate(b?.CreatedDate) ||
                    parseDate(b?.Date) ||
                    new Date(0); // Fallback to epoch if no date found

        // Sort in descending order (most recent first)
        return dateB.getTime() - dateA.getTime();
      });

      // Take only the latest 3 announcements for dashboard display
      const recentAnnouncements = sortedAnnouncements.slice(0, 3);
      
      console.log("Sorted and filtered announcements (most recent first):", recentAnnouncements);
      setAnnouncements(recentAnnouncements);
      
    } catch (err: any) {
      if (err?.code !== "ERR_CANCELED") {
        console.error("Announcements API error:", err.message || err);
        setAnnouncementError("Failed to load announcements");
        setAnnouncements([]);
      }
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [parseDate]);

  // FIXED: Updated Help Desk function with better error handling
  const fetchHelpDeskTickets = useCallback(async (unitId: number | null, signal?: AbortSignal) => {
    try {
      setLoadingHelpDesk(true);
      setHelpDeskError(null);
      
      // Don't call API if no unit ID
      if (!unitId) {
        setHelpDeskTickets([]);
        setHelpDeskPersonal(0);
        setHelpDeskCommunity(0);
        setLoadingHelpDesk(false);
        return;
      }
      
      // Filter by current unit ID
      const valuesString =
        `@p_Help_Desk_Id=NULL,@p_Society_Id=NULL,@p_Unit_Id=${unitId},@p_Help_Category_Id=NULL,@p_Help_Priority_Id=NULL,@p_Requested_By=NULL,@p_From_Request_Date=NULL,@p_To_Request_Date=NULL,@p_Service_Type=NULL,@p_Assign_To=NULL,@p_From_Resolve_Date=NULL,@p_To_Resolve_Date=NULL,@p_Help_Title=NULL,@p_Description=NULL,@p_Help_Status_Id=NULL,@p_Attribute1=NULL,@p_Attribute2=NULL,@p_Attribute3=NULL,@p_Attribute4=NULL,@p_Attribute5=NULL,@p_Attribute6=NULL,@p_Attribute7=NULL,@p_Attribute8=NULL,@p_Attribute9=NULL,@p_Attribute10=NULL,@p_Help_Desk_GUId=NULL,@p_Token_No=NULL,@p_Is_Active=NULL,@p_Is_Archived=NULL,@p_Skip=0,@p_Take=50000,@p_Email=NULL,@p_First_Name=NULL,@p_Mobile_Number=NULL,@p_Assign_To_Email=NULL,@p_Assign_To_First_Name=NULL,@p_Assign_To_Mobile_Number=NULL`;
      
      const formBody = new URLSearchParams({
        AuthKey: "86A264E4-ECF8-4627-AF83-5512FE83DAE6",
        HostKey: "8ECB211D2",
        Object: "HEM_SP_HelpDesk_Get",
        Values: valuesString,
      }).toString();
      
      const API_URL = "https://applianceservicemgmt.dev2stage.in/api/rest/Invoke";
      
      console.log(`Fetching help desk tickets for unit ID: ${unitId}`);
      
      const response = await axios.post(API_URL, formBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
        timeout: 15000, // Increased timeout
      });

      console.log("HelpDesk raw response:", response.data);
      let arr: any[] | null = null;
      if (Array.isArray(response.data)) arr = response.data;
      else if (Array.isArray(response.data?.Data)) arr = response.data.Data;
      else if (Array.isArray(response.data?.data)) arr = response.data.data;
      else if (Array.isArray(response.data?.Result)) arr = response.data.Result;

      if (!arr || arr.length === 0) {
        setHelpDeskTickets([]);
        setHelpDeskPersonal(0);
        setHelpDeskCommunity(0);
        console.log(`No tickets found for unit ID: ${unitId}`);
        return;
      }

      // Set tickets and calculate counts
      setHelpDeskTickets(arr);
      
      // Count tickets by Service_Type or any other field that indicates personal vs community
      const personalCount = arr.filter(ticket => 
        ticket?.Service_Type === "Personal" || 
        ticket?.Help_Category === "Personal" ||
        ticket?.Attribute1 === "Personal" ||
        // Add more fields to check for personal tickets
        false
      ).length;
      
      const communityCount = arr.filter(ticket => 
        ticket?.Service_Type === "Community" || 
        ticket?.Help_Category === "Community" ||
        ticket?.Attribute1 === "Community" ||
        // Add more fields to check for community tickets
        false
      ).length;
      
      // If no specific categorization found, count all as personal for now
      if (personalCount === 0 && communityCount === 0) {
        setHelpDeskPersonal(arr.length);
        setHelpDeskCommunity(0);
      } else {
        setHelpDeskPersonal(personalCount);
        setHelpDeskCommunity(communityCount);
      }
      
      console.log("Parsed HelpDesk tickets for current unit:", arr);
      console.log(`Personal: ${personalCount}, Community: ${communityCount}`);
      
    } catch (err: any) {
      if (err?.code !== "ERR_CANCELED") {
        console.error("HelpDesk API error:", err.message || err);
        
        // Handle specific HTTP status codes
        if (err.response?.status === 500) {
          setHelpDeskError("Help desk service is temporarily unavailable. Please try again later.");
        } else if (err.response?.status >= 400 && err.response?.status < 500) {
          setHelpDeskError("Unable to load tickets. Please check your connection.");
        } else {
          setHelpDeskError("Failed to load help desk tickets. Please try again.");
        }
        
        // Set default values on error
        setHelpDeskTickets([]);
        setHelpDeskPersonal(0);
        setHelpDeskCommunity(0);
      }
    } finally {
      setLoadingHelpDesk(false);
    }
  }, []);

  // FIXED: Comprehensive initial data loading function
  const initializeApp = useCallback(async () => {
    setIsInitialLoading(true);
    const controller = new AbortController();
    
    try {
      console.log('🚀 Starting app initialization...');
      
      // Step 1: Fetch units first and wait for it to complete
      const firstUnitId = await fetchUnitsFromAPI(controller.signal);
      
      if (firstUnitId && !controller.signal.aborted) {
        console.log('✅ Units loaded, now fetching dependent data for unit:', firstUnitId);
        
        // Step 2: Fetch all dependent data in parallel using the first unit ID
        await Promise.allSettled([
          fetchUnitDetails(firstUnitId, controller.signal),
          fetchHelpDeskTickets(firstUnitId, controller.signal),
          fetchRecentVisitor(firstUnitId, controller.signal),
          fetchAnnouncements(controller.signal), // This doesn't depend on unit ID
        ]);
        
        console.log('✅ All dependent data fetching completed');
      } else {
        console.log('⚠️ No units available, fetching announcements only');
        // Still fetch announcements even if no units
        await fetchAnnouncements(controller.signal);
      }
      
    } catch (error) {
      console.error('❌ App initialization error:', error);
    } finally {
      setIsInitialLoading(false);
      console.log('🏁 App initialization completed');
    }
    
    return () => controller.abort();
  }, [fetchUnitsFromAPI, fetchUnitDetails, fetchHelpDeskTickets, fetchRecentVisitor, fetchAnnouncements]);

  // FIXED: Main useEffect for app initialization
  useEffect(() => {
    initializeApp();
  }, []); // Empty dependency array - only run once on mount

  // FIXED: Fetch payment/dashboard data separately
  const fetchDashboardData = useCallback(async () => {
    try {
      // TODO: Replace with actual API calls
      // Initialize with empty/default values
      setPaymentAmount(0);
      setIsPaid(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  // Fetch dashboard data once
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleDropdown = () => {
    if (units.length > 1) {
      const toValue = dropdownOpen ? 0 : 1;
      setDropdownOpen(!dropdownOpen);
      
      Animated.timing(dropdownAnimation, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const onSelectUnit = (unitName: string) => {
    setCurrentUnit(unitName);
    const match = units.find((u) => u.name === unitName);
    setCurrentUnitId(match ? match.id : null);
    setDropdownOpen(false);
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const dropdownMaxHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250], // dropdown max height
  });

  // FIXED: When currentUnitId changes (after initial load), load its details, help desk tickets, AND visitor data
  useEffect(() => {
    // Only run if not in initial loading phase and we have a unit ID
    if (isInitialLoading || !currentUnitId) return;
    
    console.log('🔄 Unit changed, fetching data for unit:', currentUnitId);
    const controller = new AbortController();
    
    // Fetch dependent data when unit changes (after initial load)
    Promise.allSettled([
      fetchUnitDetails(currentUnitId, controller.signal),
      fetchHelpDeskTickets(currentUnitId, controller.signal),
      fetchRecentVisitor(currentUnitId, controller.signal),
    ]);
    
    return () => controller.abort();
  }, [currentUnitId, isInitialLoading, fetchUnitDetails, fetchHelpDeskTickets, fetchRecentVisitor]);

  const handlePayment = () => {
    if (isPaid) {
      Alert.alert('Already Paid', 'Payment has already been processed. Please contact admin if you have questions.');
    } else {
      setPaymentModal(true);
    }
  };

  const processPayment = () => {
    setIsPaid(true);
    setPaymentModal(false);
    Alert.alert('Success', 'Payment processed successfully!');
  };

  // Add retry function for help desk
  const retryHelpDesk = () => {
    if (currentUnitId) {
      fetchHelpDeskTickets(currentUnitId);
    }
  };

  const Card = ({ children, style = {} }: { children: React.ReactNode; style?: object }) => (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Unit Info Card */}
        <Card style={styles.unitSelectorCard}>
          <View style={styles.currentSpaceContainer}>
            <View style={styles.currentSpaceHeader}>
              <Ionicons name="home-outline" size={20} color="#666" />
              <Text style={styles.currentUnitLabel}>Current Unit:</Text>
            </View>
            
            <TouchableOpacity
              activeOpacity={isLoadingUnits ? 1 : (units.length > 1 ? 0.7 : 1)}
              onPress={!isLoadingUnits ? toggleDropdown : undefined}
              style={[
                styles.unitContainer,
                units.length > 1 && styles.unitContainerClickable,
                dropdownOpen && styles.unitContainerOpen
              ]}
            >
              <Text style={styles.unitText}>
                {isLoadingUnits
                  ? 'Loading units...'
                  : (unitsError ? 'Failed to load units' : (currentUnit || 'No units available'))}
              </Text>
              {!isLoadingUnits && units.length > 1 && (
                <Ionicons
                  name={dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color="#666"
                  style={styles.dropdownIcon}
                />
              )}
            </TouchableOpacity>
            
            {/* Dropdown Animation Container */}
            {!isLoadingUnits && units.length > 1 && (
              <Animated.View
                style={[
                  styles.dropdownContainer,
                  {
                    maxHeight: dropdownMaxHeight,
                    opacity: dropdownAnimation,
                  },
                ]}
              >
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {units.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dropdownItem,
                        item.name === currentUnit && styles.dropdownItemSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => onSelectUnit(item.name)}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          item.name === currentUnit && styles.dropdownTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.name === currentUnit && (
                        <Ionicons
                          name="checkmark-outline"
                          size={16}
                          color="#03C174"
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>
        </Card>

        {/* Unit Details Card */}
        <Card>
          <View style={styles.cardHeader}>
            <MaterialIcons name="grid-view" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Unit Details</Text>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Block</Text>
              <Text style={styles.detailValue}>{unitDetails.block || 'N/A'}</Text>
            </View>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>FloorNo</Text>
              <Text style={styles.detailValue}>{unitDetails.floor || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Built Area</Text>
              <Text style={styles.detailValue}>{unitDetails.builtArea || 'N/A'}</Text>
            </View>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Carpet Area</Text>
              <Text style={styles.detailValue}>{unitDetails.carpetArea || 'N/A'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewMoreButton}
          onPress={() => navigation.navigate("SpaceManagement" as never)}>
            <Text style={styles.viewMoreText}>View more</Text>
          </TouchableOpacity>
        </Card>

        {/* Owner Details Card */}
        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Owner Details</Text>
          </View>
          <Text style={styles.personName}>{ownerDetails.name || 'No owner information'}</Text>
          {ownerDetails.phone && (
            <View style={styles.contactInfo}>
              <Ionicons name="call-outline" size={16} color="#999" />
              <Text style={styles.contactText}>{ownerDetails.phone}</Text>
            </View>
          )}
          {ownerDetails.email && (
            <View style={styles.contactInfo}>
              <Ionicons name="mail-outline" size={16} color="#999" />
              <Text style={styles.contactText}>{ownerDetails.email}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.viewMoreButton}
          onPress={() => navigation.navigate("OwnerManagement" as never)}>
            <Text style={styles.viewMoreText}>View more</Text>
          </TouchableOpacity>
        </Card>

        {/* Occupant Details Card */}
        <Card>
          <View style={styles.cardHeader}>
            <MaterialIcons name="people-outline" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Occupant Details</Text>
          </View>
          <View style={styles.nameWithBadge}>
            <Text style={styles.personName}>{occupantDetails.name || 'No occupant information'}</Text>
            {occupantDetails.tenant && (
              <View style={styles.tenantBadge}>
                <Text style={styles.tenantBadgeText}>Tenant</Text>
              </View>
            )}
          </View>
          {occupantDetails.phone && (
            <View style={styles.contactInfo}>
              <Ionicons name="call-outline" size={16} color="#999" />
              <Text style={styles.contactText}>{occupantDetails.phone}</Text>
            </View>
          )}
          {occupantDetails.email && (
            <View style={styles.contactInfo}>
              <Ionicons name="mail-outline" size={16} color="#999" />
              <Text style={styles.contactText}>{occupantDetails.email}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.viewMoreButton} 
          onPress={() => navigation.navigate("OccupantList" as never)}>
            <Text style={styles.viewMoreText}>View more</Text>
          </TouchableOpacity>
        </Card>

        {/* UPDATED Recent Visitor Card */}
        <Card>
          <View style={styles.cardHeader}>
            <MaterialIcons name="directions-car" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Recent Visitor</Text>
          </View>
          
          {loadingVisitor && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading visitor information...</Text>
            </View>
          )}

          {visitorError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{visitorError}</Text>
            </View>
          )}

          {!loadingVisitor && !visitorError && (
            <>
              <Text style={styles.personName}>{recentVisitor.name || 'No recent visitors'}</Text>
              {recentVisitor.phone && (
                <View style={styles.contactInfo}>
                  <Ionicons name="call-outline" size={16} color="#999" />
                  <Text style={styles.contactText}>{recentVisitor.phone}</Text>
                </View>
              )}
              {recentVisitor.purpose && (
                <View style={styles.contactInfo}>
                  <Ionicons name="information-circle-outline" size={16} color="#999" />
                  <Text style={styles.contactText}>Purpose: {recentVisitor.purpose}</Text>
                </View>
              )}
              {recentVisitor.whomToMeet && (
                <View style={styles.contactInfo}>
                  <Ionicons name="person-outline" size={16} color="#999" />
                  <Text style={styles.contactText}>Meeting: {recentVisitor.whomToMeet}</Text>
                </View>
              )}
              {recentVisitor.checkin && (
                <Text style={styles.checkoutText}>Check-in: {recentVisitor.checkin}</Text>
              )}
              {recentVisitor.checkout && (
                <Text style={styles.checkoutText}>Check-out: {recentVisitor.checkout}</Text>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate("Visitor" as never)}
          >
            <Text style={styles.viewMoreText}>View more</Text>
          </TouchableOpacity>
        </Card>

        {/* Payment Due Card */}
        <Card>
          <View style={styles.cardHeader}>
            <MaterialIcons name="currency-rupee" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Payment Due</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentAmount}>₹{paymentAmount}</Text>
            {isPaid && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>Paid</Text>
              </View>
            )}
          </View>
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.warningText}>If already paid, contact Admin</Text>
          </View>
          <TouchableOpacity 
            style={[styles.viewMoreButton, isPaid && styles.disabledButton]} 
            onPress={handlePayment}
          >
            <Text style={styles.viewMoreText}>
              {isPaid ? 'Payment Complete' : 'Make Payment'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* FIXED Help Desk Card */}
        <Card>
          <View style={styles.cardHeader}>
            <MaterialIcons name="support-agent" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Help Desk</Text>
          </View>

          {loadingHelpDesk && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </View>
          )}

          {helpDeskError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{helpDeskError}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={retryHelpDesk}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loadingHelpDesk && !helpDeskError && (
            <View style={styles.countContainer}>
              {/* Count Tickets by Type */}
              <View style={styles.countItem}>
                <Text style={styles.countNumber}>
                  {helpDeskPersonal}
                </Text>
                <Text style={styles.countLabel}>Personal</Text>
              </View>

              <View style={styles.countItem}>
                <Text style={[styles.countNumber, styles.communityNumber]}>
                  {helpDeskCommunity}
                </Text>
                <Text style={styles.countLabel}>Community</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.lodgeTicketButton}
            onPress={() => navigation.navigate("HelpDesk" as never)}
          >
            <Text style={styles.lodgeTicketText}>Lodge New Ticket</Text>
          </TouchableOpacity>
        </Card>

        {/* FIXED: Announcement Card with proper date formatting and most recent first sorting */}
        <Card style={styles.lastCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="campaign" size={20} color="#1a9b8a" />
            <Text style={styles.cardTitle}>Announcements</Text>
          </View>

          {loadingAnnouncements && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading announcements...</Text>
            </View>
          )}

          {announcementError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{announcementError}</Text>
            </View>
          )}

          {!loadingAnnouncements && !announcementError && (
            <View>
              {announcements.length > 0 ? (
                announcements.map((announcement, index) => {
                  const announcementId = announcement?.Notice_Id || `announcement-${index}`;
                  const isExpanded = expandedAnnouncements[announcementId];
                  const briefDescription = announcement?.Brief_Description || announcement?.Title || 'Announcement';
                  const detailDescription = announcement?.Detail_Descrption || '';
                  const shouldShowToggle = detailDescription && detailDescription.length > 100;
                  
                  return (
                    <View key={announcementId} style={styles.announcementBox}>
                      <Text style={styles.announcementTitle}>
                        {briefDescription}
                      </Text>
                      
                      {detailDescription && (
                        <Text style={styles.announcementDescription}>
                          {isExpanded || !shouldShowToggle 
                            ? detailDescription 
                            : truncateText(detailDescription, 100)
                          }
                        </Text>
                      )}
                      
                      {shouldShowToggle && (
                        <TouchableOpacity 
                          style={styles.viewToggleButton}
                          onPress={() => toggleAnnouncementExpansion(announcementId)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewToggleText}>
                            {isExpanded ? 'View Less' : 'View More'}
                          </Text>
                          <Ionicons 
                            name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} 
                            size={14} 
                            color="#1565c0" 
                            style={styles.toggleIcon}
                          />
                        </TouchableOpacity>
                      )}
                      
                      {/* FIXED: Announcement dates with proper error handling */}
                      {announcement?.Publish_Date && (
                        <Text style={styles.announcementDate}>
                          Published: {formatDateTime(announcement.Publish_Date) || 'Date not available'}
                        </Text>
                      )}
                      
                      {announcement?.Expiry_Date && (
                        <Text style={styles.announcementDate}>
                          Expires: {formatDateTime(announcement.Expiry_Date) || 'Date not available'}
                        </Text>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.announcementBox}>
                  <Text style={styles.announcementTitle}>No Announcements</Text>
                  <Text style={styles.announcementDescription}>
                    There are currently no announcements to display.
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={paymentModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Process Payment</Text>
            <Text style={styles.modalText}>Amount: ₹{paymentAmount}</Text>
            <Text style={styles.modalSubtext}>Confirm payment processing?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={processPayment}
              >
                <Text style={styles.confirmButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unitSelectorCard: {
    position: 'relative',
    zIndex: 1000,
    overflow: 'visible',
    elevation: 6,
  },
  unitContainerClickable: {
    backgroundColor: '#fff',
    borderColor: '#03C174',
  },
  unitContainerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#03C174',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 1001,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 50,
  },
  dropdownItemSelected: {
    backgroundColor: '#f0fff4',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  dropdownTextSelected: {
    color: '#03C174',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  lastCard: {
    marginBottom: 0,
  },
  currentSpaceContainer: {
    paddingBottom: 16,
  },
  currentSpaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentUnitLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  unitText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a9b8a',
    marginLeft: 8,
  },
  // Help Desk Styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  countContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  countItem: {
    alignItems: "center",
  },
  countNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1a9b8a",
  },
  communityNumber: {
    color: '#f59e0b',
  },
  countLabel: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1a9b8a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tenantBadge: {
    backgroundColor: '#1a9b8a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
  },
  tenantBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  checkoutText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a9b8a',
  },
  paidBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 15,
  },
  paidBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#f59e0b',
  },
  helpDeskRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  helpDeskItem: {
    alignItems: 'center',
  },
  helpDeskNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a9b8a',
    marginBottom: 5,
  },
  helpDeskLabel: {
    fontSize: 16,
    color: '#666',
  },
  ticketItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ticketDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  ticketStatus: {
    fontSize: 12,
    color: "#1a9b8a",
    marginTop: 2,
  },
  lodgeTicketButton: {
    backgroundColor: '#1a9b8a',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  lodgeTicketText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewMoreButton: {
    borderWidth: 1,
    borderColor: '#1a9b8a',
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  viewMoreText: {
    color: '#1a9b8a',
    fontSize: 16,
  },
  announcementBox: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 8,
  },
  announcementSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565c0',
    marginTop: 12,
    marginBottom: 5,
  },
  announcementDescription: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  // NEW: View More/Less Toggle Button Styles
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  viewToggleText: {
    fontSize: 13,
    color: '#1565c0',
    fontWeight: '600',
  },
  toggleIcon: {
    marginLeft: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#1a9b8a',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#1a9b8a',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16, 
    fontWeight: '600',
  },
  noTicketsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 10,
  },
});

export default Dashboard;
